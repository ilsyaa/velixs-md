import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import path from "path";
import { Boom } from "@hapi/boom";
import fs from "fs";
import type { MessageReceived, StartSessionParams } from "../Types";
import { CALLBACK_KEY, CREDENTIALS, Messages, BROWSERS_DISPLAY } from "../Defaults";
import {
  saveDocumentHandler,
  saveImageHandler,
  saveVideoHandler,
} from "../Utils/save-media";
import { WhatsappError } from "../Error";

const sessions: Map<string, WASocket> = new Map();

const callback: Map<string, Function> = new Map();

const retryCount: Map<string, number> = new Map();

export const startSession = async (
  sessionId = "session1",
  options: StartSessionParams = { printQR: true }
): Promise<WASocket> => {
  if (isSessionExistAndRunning(sessionId))
    throw new WhatsappError(Messages.sessionAlreadyExist(sessionId));
  const logger = pino({ level: "silent" });

  const { version } = await fetchLatestBaileysVersion();
  const startSocket = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(
      path.resolve(CREDENTIALS.DIR_NAME, sessionId + CREDENTIALS.PREFIX)
    );
    let browser_end = Browsers.macOS(["VelixS", "Safari", "3.0"])
    switch(BROWSERS_DISPLAY.BROWSERS){
      case "macOS":
        browser_end = Browsers.macOS(["VelixS", "Safari", "3.0"])
        break
      case "Ubuntu":
        browser_end = Browsers.ubuntu(["VelixS", "Chromium", "3.0"])
        break
      default:
          browser_end = [BROWSERS_DISPLAY.BROWSERS ?? "VelixS", "Safari", "3.0"]
          break
    }
    const sock: WASocket = makeWASocket({
      version,
      printQRInTerminal: options.printQR,
      auth: state,
      logger,
      markOnlineOnConnect: false,
      browser: browser_end,
    });
    sessions.set(sessionId, { ...sock });
    try {
      sock.ev.process(async (events) => {
        if (events["connection.update"]) {
          const update = events["connection.update"];
          const { connection, lastDisconnect } = update;
          if (update.qr) {
            callback.get(CALLBACK_KEY.ON_QR)?.({
              sessionId,
              qr: update.qr,
            });
          }
          if (connection == "connecting") {
            callback.get(CALLBACK_KEY.ON_CONNECTING)?.(sessionId);
          }
          if (connection === "close") {
            const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
            let retryAttempt = retryCount.get(sessionId) ?? 0;
            let shouldRetry;
            if (code != DisconnectReason.loggedOut && retryAttempt < 10) {
              shouldRetry = true;
            }
            if (shouldRetry) {
              retryAttempt++;
            }
            if (shouldRetry) {
              retryCount.set(sessionId, retryAttempt);
              startSocket();
            } else {
              retryCount.delete(sessionId);
              deleteSession(sessionId);
              callback.get(CALLBACK_KEY.ON_DISCONNECTED)?.(sessionId);
            }
          }
          if (connection == "open") {
            retryCount.delete(sessionId);
            callback.get(CALLBACK_KEY.ON_CONNECTED)?.(sessionId);
          }
        }
        if (events["creds.update"]) {
          await saveCreds();
        }
        if (events["messages.upsert"]) {
          const msg = events["messages.upsert"]
            .messages?.[0] as unknown as MessageReceived;
          msg.sessionId = sessionId;
          msg.saveImage = (path) => saveImageHandler(msg, path);
          msg.saveVideo = (path) => saveVideoHandler(msg, path);
          msg.saveDocument = (path) => saveDocumentHandler(msg, path);
          callback.get(CALLBACK_KEY.ON_MESSAGE_RECEIVED)?.({
            ...msg,
          });
        }
      });
      return sock;
    } catch (error) {
      // console.log("SOCKET ERROR", error);
      return sock;
    }
  };
  return startSocket();
};

/**
 * @deprecated Use startSession method instead
 */
export const startWhatsapp = startSession;

export const deleteSession = async (sessionId: string) => {
  const session = getSession(sessionId);
  try {
    await session?.logout();
  } catch (error) {}
  session?.end(undefined);
  sessions.delete(sessionId);
  const dir = path.resolve(
    CREDENTIALS.DIR_NAME,
    sessionId + CREDENTIALS.PREFIX
  );
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { force: true, recursive: true });
  }
};
export const getAllSession = (): string[] => Array.from(sessions.keys());

export const getSession = (key: string): WASocket | undefined =>
  sessions.get(key) as WASocket;

const isSessionExistAndRunning = (sessionId: string): boolean => {
  if (
    fs.existsSync(path.resolve(CREDENTIALS.DIR_NAME)) &&
    fs.existsSync(
      path.resolve(CREDENTIALS.DIR_NAME, sessionId + CREDENTIALS.PREFIX)
    ) &&
    fs.readdirSync(
      path.resolve(CREDENTIALS.DIR_NAME, sessionId + CREDENTIALS.PREFIX)
    ).length &&
    getSession(sessionId)
  ) {
    return true;
  }
  return false;
};
const shouldLoadSession = (sessionId: string): boolean => {
  if (
    fs.existsSync(path.resolve(CREDENTIALS.DIR_NAME)) &&
    fs.existsSync(
      path.resolve(CREDENTIALS.DIR_NAME, sessionId + CREDENTIALS.PREFIX)
    ) &&
    fs.readdirSync(
      path.resolve(CREDENTIALS.DIR_NAME, sessionId + CREDENTIALS.PREFIX)
    ).length &&
    !getSession(sessionId)
  ) {
    return true;
  }
  return false;
};

export const loadSessionsFromStorage = () => {
  if (!fs.existsSync(path.resolve(CREDENTIALS.DIR_NAME))) {
    fs.mkdirSync(path.resolve(CREDENTIALS.DIR_NAME));
  }
  fs.readdir(path.resolve(CREDENTIALS.DIR_NAME), async (err, dirs) => {
    if (err) {
      throw err;
    }
    for (const dir of dirs) {
      const sessionId = dir.split("_")[0];
      if (!shouldLoadSession(sessionId)) continue;
      startSession(sessionId);
    }
  });
};

export const onMessageReceived = (listener: (msg: MessageReceived) => any) => {
  callback.set(CALLBACK_KEY.ON_MESSAGE_RECEIVED, listener);
};
export const onQRUpdated = (
  listener: ({ sessionId, qr }: { sessionId: string; qr: string }) => any
) => {
  callback.set(CALLBACK_KEY.ON_QR, listener);
};
export const onConnected = (listener: (sessionId: string) => any) => {
  callback.set(CALLBACK_KEY.ON_CONNECTED, listener);
};
export const onDisconnected = (listener: (sessionId: string) => any) => {
  callback.set(CALLBACK_KEY.ON_DISCONNECTED, listener);
};
export const onConnecting = (listener: (sessionId: string) => any) => {
  callback.set(CALLBACK_KEY.ON_CONNECTING, listener);
};
