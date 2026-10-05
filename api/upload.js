const crypto = require("crypto");
const auth = require("./_lib/auth");
const store = require("./_lib/store");

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 1500 * 1024; // the admin page shrinks photos before sending, so this is generous

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!auth.isAuthed(req)) return res.status(401).json({ error: "auth" });
  if (!store.ready()) return res.status(503).json({ error: "no_storage" });

  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec((req.body || {}).dataUrl || "");
  if (!match) return res.status(400).json({ error: "invalid" });
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_BYTES) return res.status(413).json({ error: "too_large" });

  const name = crypto.randomBytes(8).toString("hex") + "." + TYPES[match[1]];
  const url = await store.saveImage(name, buffer, match[1]);
  res.status(200).json({ url });
};
