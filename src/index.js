// src/index.js
import 'dotenv/config';
import express from 'express';
import { Client, middleware } from '@line/bot-sdk';

// --- 1) 讀環境變數（Vercel 上的 Settings > Environment Variables 會設定）
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const BASE_URL = process.env.BASE_URL || 'https://line-pos.vercel.app';

// --- 2) 建立 LINE Client + Express app
const client = new Client(config);
const app = express();

// 讓我們可以接收 JSON
app.use(express.json());

// --- 3) Webhook 路由：一定要有，而且要用 @line/bot-sdk 的 middleware
app.post('/webhook', middleware(config), async (req, res) => {
  try {
    const results = await Promise.all(
      req.body.events.map(handleEvent)
    );
    return res.json(results);
  } catch (err) {
    console.error('Webhook Error:', err);
    return res.status(500).end();
  }
});

// 方便你手動檢查服務是否活著（GET）
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// --- 4) 你的商業流程 / 付款模擬路由（舉例）
app.get('/pay/mock', (req, res) => {
  // 給個簡單頁面示意成功/取消按鈕
  const successUrl = `${BASE_URL}/public/success.html`;
  const cancelUrl = `${BASE_URL}/public/cancel.html`;

  const html = `
<!doctype html>
<html>
  <body>
    <h2>付款模擬頁面</h2>
    <p><a href="${successUrl}">成功</a></p>
    <p><a href="${cancelUrl}">取消</a></p>
  </body>
</html>`;
  res.type('html').send(html);
});

// 如果你想讓 public 裡的文件可被存取，打開這行：
// app.use('/public', express.static('public'));

// --- 5) 事件處理（最少要處理 Text 類型，否則會 200 但沒有反應）
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // 不處理非文字
    return Promise.resolve(null);
  }

  const text = (event.message.text || '').trim().toLowerCase();

  if (text === 'help' || text === '？' || text === '?') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '指令：menu / 加入 / 結帳 / help',
    });
  }

  if (text === 'menu') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '這裡可以回傳你的菜單、加入購物車方式等說明。',
    });
  }

  if (text === '結帳' || text === 'pay') {
    const url = `${BASE_URL}/pay/mock`;
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `前往付款：${url}`,
    });
  }

  // 預設
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `你說的是：${event.message.text}\n(輸入 help 看說明)`,
  });
}

// --- 6) 匯出給 Vercel（絕對不能 app.listen） ---
export default app;