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

for (const file of files(backup)) {
  let key = path.relative(backup, file).split(path.sep).join("/");
  if (key.startsWith("dishes/")) key = "uploads/" + key.slice("dishes/".length);
  console.log("uploading " + key);
  put(key, file);
}
console.log("Done.");
