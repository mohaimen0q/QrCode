# Venecia Restaurant — QR menu

Static site, no build step.

- `index.html` — landing page with the QR code (it always points at `menu.html` on the same address)
- `menu.html` — the menu customers see after scanning
- `js/menu-data.js` — dishes, prices and photo names; edit this to change the menu
- `assets/dishes/` — dish photos, one file per dish

## Admin page

`/admin` edits categories, dishes, prices, photos, order and display style. It needs two things set on Vercel:

1. **Storage** — Project → Storage → create a **Blob** store (public access) and connect it to this project.
2. **Sign-in** — Project → Settings → Environment Variables: `ADMIN_USER` and `ADMIN_PASSWORD`.

Redeploy after both. Until something is saved from the admin page, the site shows the menu in `js/menu-data.js`.

Local preview with the admin working: copy `.env.example` to `.env`, fill in a test user and password, run `npm run dev`.
