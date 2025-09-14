import { Client } from '@line/bot-sdk';

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
});

async function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const msg = event.message.text.trim().toLowerCase();
    if (msg === 'ping') {
      await client.replyMessage(event.replyToken, { type: 'text', text: 'pong' });
      return;
    }
    await client.replyMessage(event.replyToken, { type: 'text', text: `你說：${event.message.text}` });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }
  try {
    const body = req.body || {};
    const events = Array.isArray(body.events) ? body.events : [];
    await Promise.all(events.map(handleEvent));
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('webhook error:', err);
    res.status(200).json({ status: 'ok' }); // LINE 需要 200
  }
}