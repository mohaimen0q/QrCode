// Photos uploaded from the admin page, kept in R2 as uploads/<name>.
// Each upload gets a new random name, so a copy can be kept for a long time.
import store from "../../api/_lib/store.js";

export async function onRequestGet({ env, params }) {
  if (!/^[a-f0-9]{16}\.(jpg|png|webp)$/.test(params.name)) return new Response("Not found", { status: 404 });
  store.useBucket(env.BUCKET);
  const obj = await store.readImage(params.name);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": (obj.httpMetadata && obj.httpMetadata.contentType) || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
