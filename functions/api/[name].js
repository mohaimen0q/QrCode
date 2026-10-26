// Cloudflare Pages Function for /api/<name>: runs the same handlers as the local dev server
// (api/*.js, written in the Node style req / res) and hands them the R2 bucket as storage.
import account from "../../api/account.js";
import login from "../../api/login.js";
import menu from "../../api/menu.js";
import reviews from "../../api/reviews.js";
import settings from "../../api/settings.js";
import upload from "../../api/upload.js";
import store from "../../api/_lib/store.js";

const HANDLERS = { account, login, menu, reviews, settings, upload };

export async function onRequest({ request, env, params }) {
  const handler = HANDLERS[params.name];
  if (!handler) return new Response(null, { status: 404 });

  // the project's settings (ADMIN_USER, ADMIN_PASSWORD, RESEND_API_KEY, ...) as the handlers expect them
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") process.env[key] = value;
  }
  store.useBucket(env.BUCKET);

  const headers = {};
  request.headers.forEach((value, key) => { headers[key] = value; });
  // the visitor's address, used only for the daily review limit
  headers["x-forwarded-for"] = request.headers.get("cf-connecting-ip") || "";
  let body;
  if (!["GET", "HEAD"].includes(request.method)) {
    try { body = JSON.parse(await request.text()); } catch (e) { body = undefined; }
  }
  const req = { method: request.method, url: request.url, headers, body };

  return new Promise((resolve) => {
    const out = { statusCode: 200, headers: { "Cache-Control": "no-store" } };
    const res = {
      setHeader(key, value) { out.headers[key] = value; return res; },
      status(code) { out.statusCode = code; return res; },
      json(obj) { out.headers["Content-Type"] = "application/json"; return res.end(JSON.stringify(obj)); },
      end(text) { resolve(new Response(text == null ? null : text, { status: out.statusCode, headers: out.headers })); return res; }
    };
    Promise.resolve(handler(req, res)).catch((err) => {
      console.error(err);
      resolve(new Response(JSON.stringify({ error: "server" }), { status: 500, headers: { "Content-Type": "application/json" } }));
    });
  });
}
