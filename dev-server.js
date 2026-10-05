// Local preview only (npm run dev). On Vercel the files in /api run as serverless functions instead.
const http = require("http");
const fs = require("fs");
const path = require("path");

if (fs.existsSync(path.join(__dirname, ".env"))) {
  for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split(/\r?\n/)) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (m && m[2] && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const PORT = process.env.PORT || 5510;
const root = __dirname;
process.chdir(root);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp"
};

function sendFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let pathname = decodeURIComponent(url.pathname);

  if (pathname.startsWith("/api/")) {
    const name = pathname.slice(5).replace(/[^\w-]/g, "");
    const file = path.join(root, "api", name + ".js");
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    let raw = "";
    req.on("data", (c) => { raw += c; });
    req.on("end", () => {
      try { req.body = raw ? JSON.parse(raw) : undefined; } catch (e) { req.body = undefined; }
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (obj) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
      Promise.resolve(require(file)(req, res)).catch((err) => { console.error(err); res.status(500).json({ error: "server" }); });
    });
    return;
  }

  if (pathname.startsWith("/uploads/")) return sendFile(res, path.join(root, ".data", "uploads", path.basename(pathname)));
  if (pathname === "/") pathname = "/index.html";
  let file = path.join(root, pathname);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (!path.extname(file) && fs.existsSync(file + ".html")) file += ".html"; // same as Vercel's cleanUrls
  sendFile(res, file);
}).listen(PORT, () => console.log("Venecia menu on http://localhost:" + PORT));
