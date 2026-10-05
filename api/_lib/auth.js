const crypto = require("crypto");

const SESSION_HOURS = 12;

function configured() {
  return Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD);
}

// Signing key is derived from the admin credentials, so changing the password signs everyone out.
function key() {
  return crypto
    .createHash("sha256")
    .update(process.env.ADMIN_USER + "\n" + process.env.ADMIN_PASSWORD)
    .digest();
}

function sign(exp) {
  return crypto.createHmac("sha256", key()).update(String(exp)).digest("hex");
}

function same(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

function checkLogin(username, password) {
  if (!configured()) return false;
  // evaluate both so timing does not reveal which field was wrong
  const u = same(username, process.env.ADMIN_USER);
  const p = same(password, process.env.ADMIN_PASSWORD);
  return u && p;
}

function issueToken() {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  return exp + "." + sign(exp);
}

function isAuthed(req) {
  if (!configured()) return false;
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const exp = Number(token.slice(0, dot));
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return same(token.slice(dot + 1), sign(exp));
}

module.exports = { configured, checkLogin, issueToken, isAuthed };
