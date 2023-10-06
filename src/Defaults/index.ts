export abstract class CREDENTIALS {
  static DIR_NAME: string = "wa_credentials";
  static PREFIX: string = "_credentials";
}

export enum CALLBACK_KEY {
  ON_MESSAGE_RECEIVED = "on-message-received",
  ON_QR = "on-qr",
  ON_CONNECTED = "on-connected",
  ON_DISCONNECTED = "on-disconnected",
  ON_CONNECTING = "on-connecting",
  ON_GROUP_PARTICIPANTS_UPDATED = "on-group-participants-updated",
}

export abstract class BROWSERS_DISPLAY {
  static BROWSERS: string = "VelixS";
}

export abstract class Messages {
  static sessionAlreadyExist = (sessionId: string): string =>
    `Session ID :${sessionId} is already exist, Try another Session ID.`;

  static sessionNotFound = (sessionId: string): string =>
    `Session with ID: ${sessionId} Not Exist!`;

  static paremetersRequired = (props: string[] | string) =>
    `Parameter ${
      typeof props == "string"
        ? props
        : props instanceof Array
        ? props.join(", ")
        : ""
    } is required`;
}
