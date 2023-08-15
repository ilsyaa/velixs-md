# Whatsapp Multi Session - Menghubungkan Lebih Banyak Sesi Whatsapp dalam 1 Aplikasi

Menghubungkan aplikasi Anda dengan Whatsapp

Pustaka ringan untuk whatsapp. Tidak memerlukan Selenium atau browser lainnya.

Berdiri di atas [Baileys](https://github.com/WhiskeySockets/Baileys) Pustaka.

## Installation

Install package using npm

```
npm install velixs-md
```

Kemudian impor kode Anda

Gunakan JS Module

```ts
import * as whatsapp from "velixs-md";
```

atau gunakan CommonJS

```ts
const whatsapp = require("velixs-md");
```

## Session Usage/Examples

Start New Session

```ts
// buat sesi dengan ID : ilsyaganz

const session = await whatsapp.startSession("ilsya");
// Kemudian, pindai QR di terminal
```

Get All Session ID

```ts
const sessions = whatsapp.getAllSession();
// mengembalikan semua ID sesi yang telah dibuat
```

Get Session Data By ID

```ts
const session = whatsapp.getSession("ilsya");
// mengembalikan data sesi
```

Load Session From Storage / Load Saved Session

```ts
whatsapp.loadSessionsFromStorage();
// Mulai sesi tersimpan tanpa memindai lagi
```

## Messaging Usage/Examples

Send Text Message

```ts
await whatsapp.sendTextMessage({
  sessionId: "ilsya", // session ID
  to: "6281234567890", // always add country code (ex: 62)
  text: "Hi There, This is Message from Server!", // message you want to send
});
```

Send Image

```ts
const image = fs.readFileSync("./myimage.png"); // return Buffer
const send = await whatsapp.sendImage({
  sessionId: "ilsya",
  to: "6281234567890",
  text: "My Image Caption",
  media: image, // can from URL too
});
```

Send Video

```ts
const video = fs.readFileSync("./video.mp4"); // return Buffer
const send = await whatsapp.sendVideo({
  sessionId: "ilsya",
  to: "6281234567890",
  text: "My Video Caption",
  media: video, // can from URL too
});
```

Send Document File

```ts
const filename = "file.pdf";
const document = fs.readFileSync(filename); // return Buffer
const send = await whatsapp.sendDocument({
  sessionId: "ilsya",
  to: "6281234567890",
  filename: filename,
  media: document,
  text: "Hei, Check this Document",
});
```

Read a Message

```ts
await whatsapp.readMessage({
  sessionId: "ilsya",
  key: msg.key,
});
```

Send Typing Effect

```ts
await whatsapp.sendTyping({
  sessionId: "ilsya",
  to: "6281234567890",
  duration: 3000,
});
```

## Listener Usage/Examples

Add Listener/Callback When Receive a Message

```ts
whatsapp.onMessageReceived((msg) => {
  console.log(`New Message Received On Session: ${msg.sessionId} >>>`, msg);
});
```

Add Listener/Callback When QR Printed

```ts
whatsapp.onQRUpdated(({ sessionId, qr }) => {
  console.log(qr);
});
```

Add Listener/Callback When Session Connected

```ts
whatsapp.onConnected((sessionId) => {
  console.log("session connected :" + sessionId);
});
```

## Handling Incoming Message Examples

```ts
whatsapp.onMessageReceived(async (msg) => {
  if (msg.key.fromMe || msg.key.remoteJid.includes("status")) return;
  await whatsapp.readMessage({
    sessionId: msg.sessionId,
    key: msg.key,
  });
  await whatsapp.sendTyping({
    sessionId: msg.sessionId,
    to: msg.key.remoteJid,
    duration: 3000,
  });
  await whatsapp.sendTextMessage({
    sessionId: msg.sessionId,
    to: msg.key.remoteJid,
    text: "Hello!",
    answering: msg, // for quoting message
  });
});
```

## Save Media Message (Image, Video, Document)

```ts
wa.onMessageReceived(async (msg) => {
  if (msg.message?.imageMessage) {
    // save image
    msg.saveImage("./image.jpg");
  }

  if (msg.message?.videoMessage) {
    // save video
    msg.saveVideo("./video.mp4");
  }

  if (msg.message?.documentMessage) {
    // save document
    msg.saveDocument("./file"); // without extension
  }
});
```

## Optional Configuration Usage/Examples

Set custom credentials directory

```ts
// default dir is "wa_credentials"
whatsapp.setCredentialsDir("my_custom_dir");
// or : credentials/mycreds
```

## Authors

- [@ilsyaa](https://www.github.com/ilsyaa)

## Feedback or Support

If you have any feedback or support, please reach out to me at ilsya@velixs.com
