const auth = require("./_lib/auth");
const store = require("./_lib/store");

const SOCIALS = ["instagram", "facebook", "tiktok", "whatsapp", "snapchat", "maps"];

// Only known networks, and only https links, are kept.
function clean(input) {
  if (!input || typeof input !== "object") return null;
  const social = {};
  const given = input.social && typeof input.social === "object" ? input.social : {};
  for (const name of SOCIALS) {
    const url = String(given[name] == null ? "" : given[name]).trim().slice(0, 300);
    if (!url) continue;
    if (!/^https:\/\/[^\s"'<>]+$/.test(url)) return null;
    social[name] = url;
  }
  return { social };
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    const settings = store.ready() ? await store.readJson("settings.json") : null;
    return res.status(200).json(settings || { social: {} });
  }

  if (req.method === "PUT") {
    if (!auth.isAuthed(req)) return res.status(401).json({ error: "auth" });
    if (!store.ready()) return res.status(503).json({ error: "no_storage" });
    const settings = clean(req.body);
    if (!settings) return res.status(400).json({ error: "invalid" });
    await store.writeJson("settings.json", settings);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: "method" });
};
