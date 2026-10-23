const crypto = require("crypto");
const auth = require("./_lib/auth");
const store = require("./_lib/store");

// Each review is its own file, reviews/<visitor>/<time>-<random>.json, so two customers sending
// at the same moment never overwrite each other. Customers only ever see reviews-public.json,
// which is rebuilt from the approved reviews whenever the admin approves, hides or deletes.
const PREFIX = "reviews/";
const PUBLIC_KEY = "reviews-public.json";
const MAX_STORED = 500;    // whole inbox; new reviews are refused until the admin deletes some
const PER_VISITOR = 5;     // reviews one phone / connection can send per day
const DAY = 24 * 3600 * 1000;
const SHOWN = 30;          // approved comments kept per dish (and for the restaurant)
const KEY_RE = /^reviews\/[a-f0-9]{12}\/\d{13}-[a-f0-9]{6}\.json$/;

function text(value, max) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

// a short one-way fingerprint of the sender's connection, used only for the daily limit
function visitor(req) {
  const ip = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || (req.socket && req.socket.remoteAddress) || "")
    .split(",")[0].trim();
  return crypto.createHash("sha256").update("venecia-reviews\n" + ip).digest("hex").slice(0, 12);
}

async function readAll() {
  const entries = (await store.listKeys(PREFIX)).filter((e) => KEY_RE.test(e.key));
  const out = [];
  for (let i = 0; i < entries.length; i += 25) {
    const batch = await Promise.all(entries.slice(i, i + 25).map(async (e) => {
      const review = await store.readEntry(e).catch(() => null);
      return review ? Object.assign(review, { id: e.key }) : null;
    }));
    out.push(...batch.filter(Boolean));
  }
  return { entries, reviews: out.sort((a, b) => b.at - a.at) };
}

async function rebuildPublic(reviews) {
  const pub = { site: { n: 0, sum: 0, list: [] }, dishes: {} };
  for (const r of reviews) {
    if (!r.approved) continue;
    const bucket = r.target === "site" ? pub.site : (pub.dishes[r.target] = pub.dishes[r.target] || { n: 0, sum: 0, list: [] });
    bucket.n++;
    bucket.sum += r.stars;
    if ((r.text || r.name) && bucket.list.length < SHOWN) bucket.list.push({ stars: r.stars, text: r.text, name: r.name, at: r.at });
  }
  await store.writeJson(PUBLIC_KEY, pub);
}

function idsFrom(body) {
  const ids = Array.isArray(body && body.ids) ? body.ids : [];
  return ids.filter((id) => typeof id === "string" && KEY_RE.test(id)).slice(0, MAX_STORED);
}

module.exports = async (req, res) => {
  const all = new URL(req.url, "http://x").searchParams.get("all") === "1";

  if (req.method === "GET" && !all) {
    // the edge keeps a copy for a minute, so busy evenings don't hit storage on every visit
    res.setHeader("Vercel-CDN-Cache-Control", "max-age=60");
    const pub = store.ready() ? await store.readJson(PUBLIC_KEY) : null;
    return res.status(200).json(pub || { site: { n: 0, sum: 0, list: [] }, dishes: {} });
  }

  if (req.method === "POST") {
    if (!store.ready()) return res.status(503).json({ error: "no_storage" });
    const body = req.body || {};
    // the hidden field only automated senders fill in: pretend it worked and keep nothing
    if (text(body.website, 10)) return res.status(200).json({ ok: true });
    const stars = Number(body.stars);
    const target = text(body.target, 160);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5 || !target) return res.status(400).json({ error: "invalid" });

    const who = visitor(req);
    const mine = await store.listKeys(PREFIX + who + "/");
    const now = Date.now();
    if (mine.filter((e) => now - Number(e.key.split("/")[2].slice(0, 13)) < DAY).length >= PER_VISITOR) {
      return res.status(429).json({ error: "limit" });
    }
    if ((await store.listKeys(PREFIX)).length >= MAX_STORED) return res.status(507).json({ error: "full" });

    const review = {
      target,
      targetName: text(body.targetName, 80),
      stars,
      text: text(body.text, 500),
      name: text(body.name, 40),
      at: now,
      approved: false
    };
    await store.writeJson(PREFIX + who + "/" + now + "-" + crypto.randomBytes(3).toString("hex") + ".json", review);
    return res.status(200).json({ ok: true });
  }

  // everything below is the admin page
  if (!auth.isAuthed(req)) return res.status(401).json({ error: "auth" });
  if (!store.ready()) return res.status(503).json({ error: "no_storage" });

  if (req.method === "GET") {
    const { reviews } = await readAll();
    return res.status(200).json({ reviews, max: MAX_STORED });
  }

  if (req.method === "PATCH") {
    const ids = idsFrom(req.body);
    const approved = Boolean(req.body && req.body.approved);
    const { reviews } = await readAll();
    const changing = reviews.filter((r) => ids.includes(r.id) && r.approved !== approved);
    await Promise.all(changing.map((r) => {
      r.approved = approved;
      const copy = Object.assign({}, r);
      delete copy.id;
      return store.writeJson(r.id, copy);
    }));
    await rebuildPublic(reviews);
    return res.status(200).json({ ok: true, changed: changing.length });
  }

  if (req.method === "DELETE") {
    const ids = idsFrom(req.body);
    const { entries, reviews } = await readAll();
    await store.removeEntries(entries.filter((e) => ids.includes(e.key)));
    await rebuildPublic(reviews.filter((r) => !ids.includes(r.id)));
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: "method" });
};
