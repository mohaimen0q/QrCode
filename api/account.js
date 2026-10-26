const crypto = require("crypto");
const auth = require("./_lib/auth");
const store = require("./_lib/store");

// Password change (signed in) and reset (signed out). Both are finished only with a 6-digit code
// emailed to ADMIN_EMAIL, so knowing the password, or having the admin page open, is not enough.
const CODE_MINUTES = 10;
const MAX_TRIES = 5;           // wrong codes before the code is thrown away
const RESEND_GAP = 60 * 1000;  // at most one email a minute
const PER_HOUR = 5;            // and five an hour
const MIN_LENGTH = 8;

function adminEmail() {
  return String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

function codeHash(code) {
  return crypto.createHash("sha256").update("venecia-code\n" + code).digest("hex");
}

function checkNewPassword(next) {
  next = String(next || "");
  if (next.length < MIN_LENGTH) return "short";
  if (next.length > 200) return "long";
  return null;
}

async function sendCode(state, purpose, extra) {
  const now = Date.now();
  const sent = (state.sent || []).filter((t) => now - t < 3600 * 1000);
  if (sent.length && now - sent[sent.length - 1] < RESEND_GAP) return "wait";
  if (sent.length >= PER_HOUR) return "wait";

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const title = purpose === "reset" ? "رمز إعادة تعيين كلمة المرور" : "رمز تأكيد تغيير كلمة المرور";
  const lines = [
    title + " للوحة إدارة قائمة فينيسيا:",
    "",
    code,
    "",
    "الرمز صالح لمدة " + CODE_MINUTES + " دقائق ولمرة واحدة.",
    "إذا لم تطلب هذا، تجاهل الرسالة؛ كلمة المرور لن تتغيّر."
  ];

  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "Venecia Admin <onboarding@resend.dev>",
        to: [adminEmail()],
        subject: title + ": " + code,
        text: lines.join("\n")
      })
    });
    if (!res.ok) {
      console.error("email failed", res.status, await res.text().catch(() => ""));
      return "mail_failed";
    }
  } else if (process.env.VENECIA_DEV) {
    console.log("[dev] " + purpose + " code for " + adminEmail() + ": " + code); // local preview only
  } else {
    return "mail_not_configured";
  }

  sent.push(now);
  state.sent = sent;
  state.pending = Object.assign({ purpose, code: codeHash(code), exp: now + CODE_MINUTES * 60 * 1000, tries: 0 }, extra || {});
  await auth.writeState(state);
  return null;
}

// Checks the code against the pending one; wrong guesses are counted and end the code after MAX_TRIES.
async function useCode(state, purpose, code) {
  const p = state.pending;
  if (!p || p.purpose !== purpose || p.exp < Date.now()) return "expired";
  if (!auth.same(codeHash(String(code || "").trim()), p.code)) {
    p.tries = (p.tries || 0) + 1;
    if (p.tries >= MAX_TRIES) delete state.pending;
    await auth.writeState(state);
    return state.pending ? "wrong_code" : "expired";
  }
  return null;
}

// a new password: new version number, so every signed-in device is signed out
async function setPassword(state, hash) {
  state.hash = hash;
  state.version = (state.version || 0) + 1;
  state.changedAt = Date.now();
  delete state.pending;
  await auth.writeState(state);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!auth.configured() || !store.ready()) return res.status(503).json({ error: "not_configured" });
  if (!adminEmail()) return res.status(503).json({ error: "no_email" });
  const body = req.body || {};
  const state = await auth.readState(true);

  switch (body.action) {
    // ---- signed in: change password ----
    case "change-start": {
      if (!(await auth.isAuthed(req))) return res.status(401).json({ error: "auth" });
      if (!auth.passwordMatches(state, body.current || "")) {
        await new Promise((r) => setTimeout(r, 600));
        return res.status(400).json({ error: "wrong_current" });
      }
      const bad = checkNewPassword(body.next);
      if (bad) return res.status(400).json({ error: bad });
      const err = await sendCode(state, "change", { next: auth.hashPassword(body.next) });
      if (err) return res.status(err === "wait" ? 429 : 502).json({ error: err });
      return res.status(200).json({ ok: true });
    }
    case "change-confirm": {
      if (!(await auth.isAuthed(req))) return res.status(401).json({ error: "auth" });
      const err = await useCode(state, "change", body.code);
      if (err) return res.status(400).json({ error: err });
      await setPassword(state, state.pending.next);
      return res.status(200).json({ ok: true, token: await auth.issueToken() });
    }

    // ---- signed out: forgot password ----
    case "reset-start": {
      // same answer whether or not the email matches, so the page never reveals the admin email
      const given = String(body.email || "").trim().toLowerCase();
      if (given && auth.same(given, adminEmail())) {
        const err = await sendCode(state, "reset");
        if (err && err !== "wait") return res.status(502).json({ error: err });
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      return res.status(200).json({ ok: true });
    }
    case "reset-confirm": {
      const bad = checkNewPassword(body.next);
      if (bad) return res.status(400).json({ error: bad });
      const err = await useCode(state, "reset", body.code);
      if (err) return res.status(400).json({ error: err });
      await setPassword(state, auth.hashPassword(body.next));
      return res.status(200).json({ ok: true });
    }
  }
  res.status(400).json({ error: "action" });
};
