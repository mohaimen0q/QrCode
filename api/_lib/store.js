// Where the edited menu, reviews and uploaded photos live.
// On Cloudflare: the R2 bucket bound as BUCKET (handed over by functions/api/[name].js).
// On a developer machine (npm run dev): plain files in .data/.
const MENU_KEY = "menu.json";

let bucket = null;
function useBucket(b) {
  bucket = b || null;
}

// fs and path are only needed on a developer machine, so they are loaded there and nowhere else
function local() {
  const fs = require("fs");
  const path = require("path");
  return { fs, path, dir: path.join(process.cwd(), ".data") };
}

function ready() {
  return Boolean(bucket || process.env.VENECIA_DEV);
}

async function readJson(key) {
  if (bucket) {
    const obj = await bucket.get(key);
    return obj ? obj.json() : null;
  }
  const { fs, path, dir } = local();
  const file = path.join(dir, key);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function writeJson(key, value) {
  const body = JSON.stringify(value);
  if (bucket) {
    await bucket.put(key, body, { httpMetadata: { contentType: "application/json" } });
    return;
  }
  const { fs, path, dir } = local();
  fs.mkdirSync(path.dirname(path.join(dir, key)), { recursive: true });
  fs.writeFileSync(path.join(dir, key), body);
}

// Every stored file whose name starts with prefix: [{ key, at }] (at = upload time in ms).
async function listKeys(prefix) {
  if (bucket) {
    const out = [];
    let cursor;
    do {
      const page = await bucket.list({ prefix, cursor, limit: 1000 });
      for (const o of page.objects) out.push({ key: o.key, at: o.uploaded.getTime() });
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
    return out;
  }
  const { fs, path, dir: root } = local();
  const out = [];
  const base = path.join(root, path.dirname(prefix + "x"));
  (function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) { walk(full); continue; }
      const key = path.relative(root, full).split(path.sep).join("/");
      if (key.startsWith(prefix)) out.push({ key, at: fs.statSync(full).mtimeMs });
    }
  })(base);
  return out;
}

// Reads a JSON file found by listKeys.
function readEntry(entry) {
  return readJson(entry.key);
}

async function removeEntries(entries) {
  if (!entries.length) return;
  if (bucket) {
    for (let i = 0; i < entries.length; i += 1000) await bucket.delete(entries.slice(i, i + 1000).map((e) => e.key));
    return;
  }
  const { fs, path, dir } = local();
  for (const e of entries) {
    const file = path.join(dir, e.key);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

function readMenu() {
  return readJson(MENU_KEY);
}

function writeMenu(menu) {
  return writeJson(MENU_KEY, menu);
}

// Photos are kept as uploads/<name> and served at /uploads/<name>
// (by functions/uploads/[name].js on Cloudflare, by dev-server.js locally).
async function saveImage(name, buffer, contentType) {
  if (bucket) {
    await bucket.put("uploads/" + name, buffer, { httpMetadata: { contentType } });
  } else {
    const { fs, path, dir } = local();
    fs.mkdirSync(path.join(dir, "uploads"), { recursive: true });
    fs.writeFileSync(path.join(dir, "uploads", name), buffer);
  }
  return "/uploads/" + name;
}

async function readImage(name) {
  if (!bucket) return null;
  return bucket.get("uploads/" + name);
}

module.exports = { useBucket, ready, readJson, writeJson, readMenu, writeMenu, saveImage, readImage, listKeys, readEntry, removeEntries };
