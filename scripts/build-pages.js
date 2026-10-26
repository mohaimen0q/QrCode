// Cloudflare Pages build: copies only the files visitors load into dist/
// (the server code in api/ and functions/ is bundled by Cloudflare separately and never served as files).
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "dist");
const PAGES = ["index.html", "menu.html", "en.html", "admin.html", "_headers"];
const FOLDERS = ["css", "js", "assets"];
const SKIP = new Set(["dishes.zip"]);

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);

for (const file of PAGES) fs.copyFileSync(path.join(root, file), path.join(out, file));

function copy(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    if (SKIP.has(name)) continue;
    const src = path.join(from, name);
    if (fs.statSync(src).isDirectory()) copy(src, path.join(to, name));
    else fs.copyFileSync(src, path.join(to, name));
  }
}
for (const folder of FOLDERS) copy(path.join(root, folder), path.join(out, folder));
