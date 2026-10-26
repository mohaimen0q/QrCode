// Copies everything in the Vercel Blob store (menu, settings, reviews, admin sign-in, photos)
// into backup/, keeping the same folder layout. Signs in with BLOB_READ_WRITE_TOKEN from .env, or with
// BLOB_STORE_ID + VERCEL_OIDC_TOKEN from .env.vercel (made by `npx vercel env pull .env.vercel`).
// Run: npm install, then npm run backup
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
for (const name of [".env", ".env.vercel"]) {
  const envFile = path.join(root, name);
  if (!fs.existsSync(envFile)) continue;
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z_]+)="?(.*?)"?$/.exec(line.trim());
    if (m && m[2] && m[2] !== "[SENSITIVE]" && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
if (!process.env.BLOB_READ_WRITE_TOKEN && !(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)) {
  console.error("Add BLOB_READ_WRITE_TOKEN=... to .env (Vercel > Storage > the blob store > .env.local),");
  console.error("or run `npx vercel env pull .env.vercel --environment=production` in this folder.");
  process.exit(1);
}

(async () => {
  const { list } = require("@vercel/blob");
  const out = path.join(root, "backup");
  const blobs = [];
  let cursor;
  do {
    const page = await list({ cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  console.log(blobs.length + " files found");

  let failed = 0;
  for (const blob of blobs) {
    const res = await fetch(blob.url + "?v=" + Date.now());
    if (!res.ok) {
      failed++;
      console.error("could not download " + blob.pathname + " (" + res.status + ")");
      continue;
    }
    const file = path.join(out, ...blob.pathname.split("/"));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    console.log("saved " + blob.pathname);
  }
  console.log(failed ? failed + " files failed, see above" : "Done: everything is in backup/");
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
