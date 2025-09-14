// /api/health  -> 200 OK
export default function handler(req, res) {
  res.status(200).json({ ok: true, ts: Date.now() });
}