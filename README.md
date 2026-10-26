# Venecia Restaurant — QR menu

Static pages plus a few small server routes (`/api`), hosted on Cloudflare Pages.

- `index.html` — landing page with the QR code (it always points at `menu.html` on the same address)
- `menu.html` — the menu customers see after scanning
- `js/menu-data.js` — dishes, prices and photo names; edit this to change the menu
- `assets/dishes/` — dish photos, one file per dish

## Admin page

`/admin` edits categories, dishes, prices, photos, order and display style.

## Hosting on Cloudflare Pages

1. **Storage** — R2 → create a bucket named `venicia` (the name in `wrangler.toml`).
2. **Project** — Workers & Pages → Create → Pages → connect this GitHub repository.
   Build command `npm run build`, output folder `dist`.
3. **R2 link** — Project → Settings → Bindings → add an R2 bucket binding named `BUCKET` → `venicia`.
4. **Settings** — Project → Settings → Variables and Secrets: `ADMIN_USER`, `ADMIN_PASSWORD`,
   and for password codes by email `ADMIN_EMAIL`, `RESEND_API_KEY`, `MAIL_FROM`.

Redeploy after these. Until something is saved from the admin page, the site shows the menu in `js/menu-data.js`.

Moving the data from the old Vercel Blob store: put `BLOB_READ_WRITE_TOKEN` in `.env`, run `npm install`
and `npm run backup` (copies everything into `backup/`), then `npx wrangler login` and `npm run upload-r2`.

Local preview with the admin working: copy `.env.example` to `.env`, fill in a test user and password, run `npm run dev`.
