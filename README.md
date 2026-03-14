# whatsapp-quality-bot

A WhatsApp bot that listens for documents you send to yourself and echoes them back as a media upload.

## Requirements

- Node.js 18+
- A WhatsApp account

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```
   MY_NUMBER=91XXXXXXXXXX@c.us
   ```
   Replace `91XXXXXXXXXX` with your number in international format (no `+` or spaces).

3. Start the bot:
   ```bash
   npm start
   ```

4. Scan the QR code that appears in the terminal using WhatsApp → Linked Devices → Link a Device.

After the first scan, the session is saved locally and you won't need to scan again.

## How it works

- Uses [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) to connect via WhatsApp Web
- Listens on the `message_create` event for messages sent from your own account
- Only reacts to `document` type messages sent to yourself
- Downloads the document and sends it back as a media upload (no caption)
- Skips files larger than 50 MB to prevent Puppeteer from crashing
- Loop protection: tracks sent message IDs to prevent infinite echo loops

## Files

| File | Description |
|---|---|
| `index.js` | Main bot logic |
| `.env` | Your WhatsApp number (not committed) |
| `.wwebjs_auth/` | Saved session (not committed) |

## Notes

- `.env` and `.wwebjs_auth/` are gitignored — never committed
- The bot ignores all messages from other people — only reacts to your own messages
