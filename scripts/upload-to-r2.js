// Puts the backup made by scripts/backup-vercel-blob.js into the Cloudflare R2 bucket.
// Photos move from dishes/<name> to uploads/<name>, and the menu's photo links are changed to match.
// Run once, after `npx wrangler login`: npm run upload-r2
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const BUCKET = "venicia";
const root = path.join(__dirname, "..");
const backup = path.join(root, "backup");
if (!fs.existsSync(backup)) {
  console.error("No backup/ folder: run npm run backup first.");
  process.exit(1);
}

const TYPES = { ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

function files(dir) {
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return fs.statSync(full).isDirectory() ? files(full) : [full];
  });
}

function put(key, file) {
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  execFileSync("npx", ["wrangler", "r2", "object", "put", BUCKET + "/" + key, "--file", file, "--content-type", type, "--remote"],
    { stdio: "inherit", shell: process.platform === "win32" });
}

// the saved menu points at Vercel Blob photo links; on Cloudflare they are /uploads/<name>
const menuFile = path.join(backup, "menu.json");
if (fs.existsSync(menuFile)) {
  const menu = JSON.parse(fs.readFileSync(menuFile, "utf8"));
  let moved = 0;
  for (const cat of menu) {
    for (const item of cat.items || []) {
      const m = /^https:\/\/[^/]+\.blob\.vercel-storage\.com\/dishes\/([\w.-]+)$/.exec(item.img || "");
      if (m) { item.img = "/uploads/" + m[1]; moved++; }
    }
  }
  fs.writeFileSync(menuFile, JSON.stringify(menu));
  console.log(moved + " photo links in the menu now point to /uploads/");
}

// a backup taken from the public addresses has no single review files (their names are random), only the
// approved list in reviews-public.json: turn those back into review files, so the admin page lists them
// and approving or hiding another review later does not drop them
const publicFile = path.join(backup, "reviews-public.json");
if (fs.existsSync(publicFile) && !fs.existsSync(path.join(backup, "reviews"))) {
  const crypto = require("crypto");
  const pub = JSON.parse(fs.readFileSync(publicFile, "utf8"));
  const groups = [["site", pub.site]].concat(Object.entries(pub.dishes || {}));
  let made = 0;
  for (const [target, group] of groups) {
    for (const r of (group && group.list) || []) {
      const key = path.join(backup, "reviews", "000000000000", r.at + "-" + crypto.randomBytes(3).toString("hex") + ".json");
      fs.mkdirSync(path.dirname(key), { recursive: true });
      fs.writeFileSync(key, JSON.stringify({ target, targetName: "", stars: r.stars, text: r.text || "", name: r.name || "", at: r.at, approved: true }));
      made++;
    }
  }
  console.log(made + " approved reviews turned back into review files");
}

for (const file of files(backup)) {
  let key = path.relative(backup, file).split(path.sep).join("/");
  if (key.startsWith("dishes/")) key = "uploads/" + key.slice("dishes/".length);
  console.log("uploading " + key);
  put(key, file);
}
console.log("Done.");
