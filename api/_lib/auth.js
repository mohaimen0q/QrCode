const crypto = require("crypto");
const store = require("./store");

const SESSION_HOURS = 12;
// The admin's own password (after a change or reset) and any pending email code live here,
// encrypted with a key made from ADMIN_USER + ADMIN_PASSWORD, because stored files are public.
// Changing ADMIN_PASSWORD on the host makes this file unreadable, so the host's password works
// again: the last-resort way back in.
const STATE_KEY = "admin-auth.json";
const CACHE_MS = 30 * 1000;

function configured() {
  return Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD);
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest();
}

function boxKey() {
  return sha256("venecia-auth\n" + process.env.ADMIN_USER + "\n" + process.env.ADMIN_PASSWORD);
}

function seal(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", boxKey(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return { iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") };
}

function open(box) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", boxKey(), Buffer.from(box.iv, "base64"));
  decipher.setAuthTag(Buffer.from(box.tag, "base64"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(box.data, "base64")), decipher.final()]).toString("utf8"));
}

let cached = null;
let cachedAt = 0;

// fresh = skip the short in-memory copy (used for sign-in and password changes)
async function readState(fresh) {
  if (!fresh && cached && Date.now() - cachedAt < CACHE_MS) return cached;
  let state = {};
  if (store.ready()) {
    try {
      const box = await store.readJson(STATE_KEY);
      if (box) state = open(box);
    } catch (e) {
      state = {}; // unreadable: ADMIN_PASSWORD was changed on the host, so start over from it
    }
  }
  cached = state;
  cachedAt = Date.now();
  return state;
}

async function writeState(state) {
  await store.writeJson(STATE_KEY, seal(state));
  cached = state;
  cachedAt = Date.now();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return salt.toString("hex") + ":" + crypto.scryptSync(String(password), salt, 32).toString("hex");
}

function same(a, b) {
  return crypto.timingSafeEqual(sha256(String(a)), sha256(String(b)));
}

function passwordMatches(state, password) {
  if (!state.hash) return same(password, process.env.ADMIN_PASSWORD);
  const [salt, hash] = state.hash.split(":");
  const test = crypto.scryptSync(String(password), Buffer.from(salt, "hex"), 32);
  return crypto.timingSafeEqual(test, Buffer.from(hash, "hex"));
}

// Sessions are signed with the current password version, so a change or reset signs out every device.
function sign(exp, state) {
  const key = sha256(process.env.ADMIN_USER + "\n" + process.env.ADMIN_PASSWORD + "\n" + (state.version || 0));
  return crypto.createHmac("sha256", key).update(String(exp)).digest("hex");
}

async function checkLogin(username, password) {
  if (!configured()) return false;
  const state = await readState(true);
  // evaluate both so timing does not reveal which field was wrong
  const u = same(username, process.env.ADMIN_USER);
  const p = passwordMatches(state, password);
  return u && p;
}

async function issueToken() {
  const state = await readState(true);
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  return exp + "." + sign(exp, state);
}

async function isAuthed(req) {
  if (!configured()) return false;
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const exp = Number(token.slice(0, dot));
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return same(token.slice(dot + 1), sign(exp, await readState(false)));
}

module.exports = { configured, checkLogin, issueToken, isAuthed, readState, writeState, hashPassword, passwordMatches, same };
