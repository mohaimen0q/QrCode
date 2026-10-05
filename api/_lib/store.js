// Where the edited menu and uploaded photos live.
// On Vercel: the connected Blob store. On a developer machine: plain files in .data/.
const fs = require("fs");
const path = require("path");

const MENU_KEY = "menu.json";
// A connected store gives the project BLOB_STORE_ID (the SDK then signs in through Vercel itself);
// older connections give BLOB_READ_WRITE_TOKEN instead. Either one means the store is usable.
const useBlob = Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
const localDir = path.join(process.cwd(), ".data");

function ready() {
  return useBlob || !process.env.VERCEL;
}

async function readMenu() {
  if (useBlob) {
    const { list } = require("@vercel/blob");
    const { blobs } = await list({ prefix: MENU_KEY, limit: 1 });
    if (!blobs.length) return null;
    // the upload time in the query string skips the CDN copy of an older save
    const stamp = new Date(blobs[0].uploadedAt).getTime();
    const res = await fetch(blobs[0].url + "?v=" + stamp, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  }
  const file = path.join(localDir, MENU_KEY);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function writeMenu(menu) {
  const body = JSON.stringify(menu);
  if (useBlob) {
    const { put } = require("@vercel/blob");
    await put(MENU_KEY, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60
    });
    return;
  }
  fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(path.join(localDir, MENU_KEY), body);
}

async function saveImage(name, buffer, contentType) {
  if (useBlob) {
    const { put } = require("@vercel/blob");
    const blob = await put("dishes/" + name, buffer, { access: "public", contentType });
    return blob.url;
  }
  const dir = path.join(localDir, "uploads");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), buffer);
  return "/uploads/" + name; // served by dev-server.js only
}

module.exports = { ready, readMenu, writeMenu, saveImage };
