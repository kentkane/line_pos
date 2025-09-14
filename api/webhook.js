// /api/webhook
import { Client } from '@line/bot-sdk';

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

// 處理單一 event
async function handleEvent(event) {
  // 只回應文字訊息
  if (event.type === 'message' && event.message?.type === 'text') {
    const text = (event.message.text || '').trim();

    // 簡單指令
    if (text === 'help' || text === '？' || text === '?') {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '指令：menu、add、cart、payurl、help'
      });
    }

    if (text === 'menu') {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '這裡是菜單（示意），請輸入 add 來加入購物車'
      });
    }

    if (text.startsWith('add')) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '已加入購物車（示意）'
      });
    }

    if (text === 'cart') {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '購物車內容（示意）'
      });
    }

    if (text === 'payurl') {
      const base = process.env.BASE_URL || 'https://example.com';
      const success = `${base}/public/success.html`;
      const cancel = `${base}/public/cancel.html`;

      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `付款連結（示意）：${base}/pay/mock?success=${encodeURIComponent(success)}&cancel=${encodeURIComponent(cancel)}`
      });
    }

    // 其他訊息就 echo
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `你說：${text}`
    });
  }

  // 其他 event 一律 200 不處理
  return Promise.resolve(null);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // LINE 不會用 GET，方便你自己測
    return res.status(200).send('OK');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const events = Array.isArray(body.events) ? body.events : [];

    await Promise.all(events.map(handleEvent));
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('webhook error:', err);
    // 回 200，避免 LINE 重試轟炸（開發期）
    return res.status(200).json({ status: 'ok' });
  }
}