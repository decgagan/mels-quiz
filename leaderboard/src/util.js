// Shared helpers for the Mel's Quiz Worker: web addresses allowed to talk to it, JSON replies, hashing.

export const ALLOWED_ORIGINS = ["https://decgagan.github.io"];   // the live site
export const ALLOW_LOCALHOST = true;                              // http://localhost and http://127.0.0.1 (any port) for testing

export function originAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOW_LOCALHOST && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const headers = { "Vary": "Origin" };
  if (originAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

export function json(request, data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders(request), ...extra },
  });
}

export function fail(request, status, message, extra) {
  return json(request, { ok: false, error: message }, status, extra);
}

/** Refuses POSTs that come from other websites. Returns a Response to send back, or null if fine. */
export function checkOrigin(request) {
  const origin = request.headers.get("Origin");
  if (origin && !originAllowed(origin)) return fail(request, 403, "This website isn't allowed to do that.");
  return null;
}

/** Reads a small JSON body. Returns { body } or { response } (an error reply to send). */
export async function readJson(request, maxBytes = 2048) {
  const text = await request.text();
  if (text.length > maxBytes) return { response: fail(request, 413, "That request is too big.") };
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("not an object");
    return { body };
  } catch (e) {
    return { response: fail(request, 400, "Send a JSON object.") };
  }
}

// ---- hashing ----
const enc = new TextEncoder();

export function toHex(buf) {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
export function fromHex(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}
export function randomHex(bytes) {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}
export async function sha256Hex(text) {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

export const PIN_ITERATIONS = 10000;

async function pbkdf2Hex(pin, saltHex, iterations, pepper) {
  const key = await crypto.subtle.importKey("raw", enc.encode(String(pepper || "") + pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations }, key, 256);
  return toHex(bits);
}

/** Turns a PIN into "pbkdf2-sha256:iterations:salt:hash" with a fresh random salt for this profile. */
export async function hashPin(pin, pepper) {
  const salt = randomHex(16);
  return `pbkdf2-sha256:${PIN_ITERATIONS}:${salt}:${await pbkdf2Hex(pin, salt, PIN_ITERATIONS, pepper)}`;
}

function sameText(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPin(pin, stored, pepper) {
  const parts = String(stored).split(":");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1) return false;
  return sameText(await pbkdf2Hex(pin, parts[2], iterations, pepper), parts[3]);
}

// ---- tiny in-memory "one go every few seconds" guard (best effort; resets when the Worker restarts) ----
export function makeGap() {
  const last = new Map();
  return {
    /** Returns the seconds to wait, or 0 if it's fine to go. Doesn't start the clock. */
    wait(key, gapMs) {
      if (gapMs <= 0) return 0;
      const t = last.get(key);
      if (t === undefined || Date.now() - t >= gapMs) return 0;
      return Math.ceil((gapMs - (Date.now() - t)) / 1000);
    },
    mark(key, gapMs) {
      const now = Date.now();
      if (last.size > 1000) for (const [k, t] of last) if (now - t > gapMs) last.delete(k);
      last.set(key, now);
    },
  };
}
