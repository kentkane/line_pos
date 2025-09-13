# LINE 點餐機器人（MVP）

功能：
- 使用者在 LINE 聊天輸入 `menu` 看菜單
- 點按 Quick Reply 加入餐點
- 輸入 `cart` 看購物車
- 輸入 `checkout` 產生模擬付款連結（成功/取消）

> 這是最小可行範例，尚未串接 LINE Pay（以 mock 頁面代替）。未接資料庫（使用記憶體暫存）。

## 安裝

1. Node.js 18+
2. 建立 LINE Developers Messaging API Channel，取得：
   - Channel Secret
   - Channel Access Token
3. 建 `.env` 檔（可參考 `.env.example`）：

```
PORT=3000
LINE_CHANNEL_SECRET=你的ChannelSecret
LINE_CHANNEL_ACCESS_TOKEN=你的AccessToken
BASE_URL=https://你的外網網址或ngrok網址
```

4. 安裝套件並啟動：
```bash
npm install
npm run dev
```

5. 將 Webhook URL 設為：`{BASE_URL}/webhook` 並 **啟用**。

## 指令

- `menu`：顯示菜單並提供 Quick Reply 按鈕。
- 點 Quick Reply 會加入購物車。
- `cart`：顯示購物車項目與金額總計。
- `checkout`：回覆付款連結（模擬）→ 使用者可點擊「成功」或「取消」。

## 下一步（客製/上線前建議）

- 串接 LINE Pay（需要商店申請與簽名驗證）。
- 加入資料庫（SQLite / PostgreSQL / MongoDB）。
- 後台管理（菜單、庫存、訂單）。
- 權限管控、稅金與發票、外送/內用參數。
- 錯誤追蹤與日誌（例如 Sentry）。