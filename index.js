require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const MY_NUMBER = process.env.MY_NUMBER;
const sentEchoIds = new Set();

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR code generated. Scan it with WhatsApp.');
});

client.on('ready', () => {
    console.log('Client is ready!');
    console.log('My WID (wid._serialized):', client.info.wid._serialized);
    console.log('My WID (full object):', JSON.stringify(client.info.wid, null, 2));
});

client.on('authenticated', () => {
    console.log('Authenticated!');
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failure:', msg);
});

async function handleDocument(msg, source) {
    console.log(`--- [${source}] ---`);
    console.log('  from:     ', msg.from);
    console.log('  to:       ', msg.to);
    console.log('  type:     ', msg.type);
    console.log('  hasMedia: ', msg.hasMedia);
    console.log('  fromMe:   ', msg.fromMe);

    if (!msg.fromMe) {
        console.log('  -> Skipping: not fromMe');
        return;
    }

    const msgId = msg.id._serialized;
    if (sentEchoIds.has(msgId)) {
        console.log('  -> Skipping: this is our own echo, breaking loop');
        sentEchoIds.delete(msgId);
        return;
    }
    if (!msg.hasMedia) {
        console.log('  -> Skipping: no media attached');
        return;
    }
    if (msg.type !== 'document') {
        console.log('  -> Skipping: type is not document, got:', msg.type);
        return;
    }

    console.log('  -> Downloading media...');
    const media = await msg.downloadMedia();
    if (!media) {
        console.log('  -> Failed to download media.');
        return;
    }

    console.log('  -> Media downloaded:', media.filename, '|', media.mimetype);

    // Base64 length * 0.75 gives approximate byte size
    const estimatedBytes = Math.round(media.data.length * 0.75);
    const estimatedMB = (estimatedBytes / (1024 * 1024)).toFixed(1);
    console.log(`  -> Estimated file size: ${estimatedMB} MB`);

    const MAX_MB = 50;
    if (estimatedBytes > MAX_MB * 1024 * 1024) {
        console.log(`  -> Skipping: file too large (${estimatedMB} MB > ${MAX_MB} MB limit)`);
        return;
    }

    try {
        const sent = await client.sendMessage(MY_NUMBER, media, {
            caption: `Echo: ${media.filename || 'document'}`,
        });
        sentEchoIds.add(sent.id._serialized);
        console.log('  -> Document sent back successfully. Echo ID tracked:', sent.id._serialized);
    } catch (err) {
        console.error('  -> Failed to send document:', err);
    }
}

client.on('message', async (msg) => {
    await handleDocument(msg, 'message');
});

client.on('message_create', async (msg) => {
    await handleDocument(msg, 'message_create');
});

client.initialize();
