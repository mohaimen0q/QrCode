const auth = require("./_lib/auth");
const store = require("./_lib/store");

const LAYOUTS = ["list", "cards", "text"];

function text(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

// Keeps only the fields the menu page understands, so a bad request cannot store anything else.
function clean(input) {
  if (!Array.isArray(input) || input.length > 40) return null;
  const used = new Set();
  const out = [];
  for (const cat of input) {
    if (!cat || typeof cat !== "object") return null;
    const title = text(cat.title, 60);
    if (!title) return null;
    let id = text(cat.id, 40).replace(/[^\w-]/g, "");
    if (!id || used.has(id)) id = "c" + Math.random().toString(36).slice(2, 9);
    used.add(id);

    if (!Array.isArray(cat.items) || cat.items.length > 120) return null;
    const items = [];
    for (const item of cat.items) {
      if (!item || typeof item !== "object") return null;
      const n = text(item.n, 80);
      const p = Number(item.p);
      if (!n || !Number.isFinite(p) || p < 0 || p > 1000000) return null;
      const dish = { n, p };
      const d = text(item.d, 240);
      const d2 = text(item.d2, 240);
      const img = text(item.img, 400);
      if (d) dish.d = d;
      if (d2) dish.d2 = d2;
      for (const [key, max] of [["nEn", 80], ["dEn", 240], ["d2En", 240]]) {
        const value = text(item[key], max);
        if (value) dish[key] = value;
      }
      if (img && /^(https:\/\/[^\s"'<>]+|\/uploads\/[\w.-]+|[\w-]+)$/.test(img)) dish.img = img;
      if (item.hidden === true) dish.hidden = true;
      items.push(dish);
    }
    const entry = { id, title, layout: LAYOUTS.includes(cat.layout) ? cat.layout : "list", items };
    const titleEn = text(cat.titleEn, 60);
    if (titleEn) entry.titleEn = titleEn;
    out.push(entry);
  }
  return out;
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    // null = nothing saved yet; the pages then use the menu that ships with the site
    const menu = store.ready() ? await store.readMenu() : null;
    return res.status(200).json(menu || null);
  }

  if (req.method === "PUT") {
    if (!auth.isAuthed(req)) return res.status(401).json({ error: "auth" });
    if (!store.ready()) return res.status(503).json({ error: "no_storage" });
    const menu = clean(req.body);
    if (!menu) return res.status(400).json({ error: "invalid" });
    await store.writeMenu(menu);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: "method" });
};
