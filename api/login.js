const auth = require("./_lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!auth.configured()) return res.status(503).json({ error: "not_configured" });

  const body = req.body || {};
  if (!auth.checkLogin(body.username || "", body.password || "")) {
    // slow down guessing a little
    await new Promise((r) => setTimeout(r, 600));
    return res.status(401).json({ error: "invalid" });
  }
  res.status(200).json({ token: auth.issueToken() });
};
