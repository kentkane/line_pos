export default function handler(req, res) {
  if (req.method === 'POST') {
    console.log('Webhook body:', req.body);
    res.status(200).json({ ok: true });
  } else {
    res.status(200).json({ ok: true, message: 'webhook ready' });
  }
}