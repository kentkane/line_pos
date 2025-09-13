import 'dotenv/config';
import express from 'express';
import { Client, middleware as lineMiddleware } from '@line/bot-sdk';
import { MENU } from './menu.js';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const app = express();
app.use('/public', express.static('public'));
app.use(lineMiddleware(config));
app.use(express.json());

const client = new Client(config);

// In-memory carts: userId -> { items: [{id, name, price, qty}] }
const carts = new Map();

function getCart(userId) {
  if (!carts.has(userId)) carts.set(userId, { items: [] });
  return carts.get(userId);
}

function addItemToCart(userId, itemId) {
  const cart = getCart(userId);
  const item = MENU.find(x => x.id === itemId);
  if (!item) return false;
  const found = cart.items.find(x => x.id === itemId);
  if (found) found.qty += 1;
  else cart.items.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
  return true;
}

function cartSummary(userId) {
  const cart = getCart(userId);
  if (cart.items.length === 0) return '購物車是空的。請輸入 "menu" 開始點餐。';
  const lines = cart.items.map(i => `• ${i.name} x${i.qty} - $${i.price * i.qty}`);
  const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  return lines.join('\n') + `\n\n合計：$${total}`;
}

function quickReplyMenu() {
  return {
    items: MENU.slice(0, 12).map(m => ({
      type: 'action',
      action: {
        type: 'message',
        label: `${m.name} $${m.price}`,
        text: `add ${m.id}`
      }
    }))
  };
}

app.post('/webhook', async (req, res) => {
  const events = req.body.events || [];
  await Promise.all(events.map(handleEvent));
  res.status(200).end();
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;
  const userId = event.source.userId;
  const text = event.message.text.trim().toLowerCase();

  if (text === 'menu') {
    const menuText = MENU.map(m => `• ${m.name}（id: ${m.id}）$${m.price}`).join('\n');
    return client.replyMessage(event.replyToken, [
      { type: 'text', text: '請選擇商品（點 Quick Reply 也可快速加入）：', quickReply: quickReplyMenu() },
      { type: 'text', text: menuText }
    ]);
  }

  if (text.startsWith('add ')) {
    const id = text.split(' ')[1];
    const ok = addItemToCart(userId, id);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: ok ? `已加入：${id}\n\n輸入 "cart" 查看購物車，或輸入 "checkout" 結帳。` : '找不到此商品 id。請輸入 "menu" 查看清單。'
    });
  }

  if (text === 'cart') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: cartSummary(userId)
    });
  }

  if (text === 'checkout') {
    const cart = getCart(userId);
    if (cart.items.length === 0) {
      return client.replyMessage(event.replyToken, { type: 'text', text: '購物車是空的，先輸入 "menu" 點餐吧！' });
    }
    const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const successUrl = `${base}/public/success.html`;
    const cancelUrl  = `${base}/public/cancel.html`;
    const payUrl = `${base}/pay/mock?amount=${total}&success=${encodeURIComponent(successUrl)}&cancel=${encodeURIComponent(cancelUrl)}`;
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `模擬付款金額：$${total}\n請點擊連結付款（模擬）：\n${payUrl}`
    });
  }

  // help
  if (text === 'help' || text === '？' || text === '？') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '指令：\nmenu：顯示菜單\nadd <id>：加入商品\ncart：查看購物車\ncheckout：模擬結帳'
    });
  }

  // default
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '嗨～輸入 "menu" 開始點餐；或 "help" 看指令。'
  });
}

// Mock payment endpoint: redirect to success or cancel
app.get('/pay/mock', (req, res) => {
  const { amount, success, cancel } = req.query;
  const html = `
    <html><body>
      <h2>模擬付款頁</h2>
      <p>金額：$${amount || 0}</p>
      <a href="${success || '/public/success.html'}">模擬付款成功</a>
      <br/>
      <a href="${cancel || '/public/cancel.html'}">模擬取消</a>
    </body></html>`;
  res.send(html);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on :${port}`);
});