import 'dotenv/config';
import express from 'express';
import { Client, middleware } from '@line/bot-sdk';

const app = express();

// LINE 設定
const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

// 初始化 LINE client
const client = new Client(config);

// ============ Health Check ============
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ============ Webhook ============
app.post('/webhook', middleware(config), async (req, res) => {
  try {
    const events = req.body.events;
    const results = await Promise.all(events.map(handleEvent));
    res.json(results);
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).end();
  }
});

// ============ Event Handler ============
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const text = event.message.text.trim();

  // 使用者輸入 "menu"
  if (text === 'menu') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '這裡是菜單範例：\n1. 蛋炒飯 $100\n2. 牛肉麵 $150\n輸入 add 1 或 add 2 加入購物車',
    });
  }

  // 使用者輸入 "help"
  if (text === 'help') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '輸入 "menu" 查看菜單，輸入 "checkout" 結帳',
    });
  }

  // 使用者輸入 "checkout"
  if (text === 'checkout') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '模擬結帳成功 ✅ 謝謝光臨！',
    });
  }

  // 預設回覆
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `你說了：${text}`,
  });
}

// ============ 啟動伺服器 (本地端用) ============
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});