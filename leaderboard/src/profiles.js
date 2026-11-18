// Player profiles: create, sign in, sign out, "who am I", delete.
//
//   POST /profiles      { name, pin }  -> 201 { ok, token, profile }
//   POST /login         { name, pin }  -> { ok, token, profile }
//   POST /logout        (Authorization: Bearer <token>)  -> { ok }
//   GET  /me            (Authorization: Bearer <token>)  -> { ok, profile }
//   POST /me/delete     (Authorization: Bearer <token>)  -> { ok }   removes the profile and all their scores
//
// Stored per player: name, a salted hash of the PIN (never the PIN), scores and stats. No email, no IP address.

import { json, fail, checkOrigin, readJson, hashPin, checkPin, randomHex, sha256Hex, makeGap } from "./util.js";

export const MAX_NAME_LENGTH = 20;
const PIN_PATTERN = /^\d{4}$/;
const MAX_WRONG_PINS = 5;                 // this many wrong PINs in a row...
const LOCK_MINUTES = 15;                  // ...and that profile is locked for this long
const SESSION_DAYS = 400;                 // a device stays signed in this long
const MAX_SESSIONS_PER_PROFILE = 8;       // the oldest signed-in device is dropped after this many
const DEFAULT_SECONDS_BETWEEN_CREATES = 5; // per IP address; 0 switches it off

const createGap = makeGap();
// A real stored hash for a PIN nobody has, used to keep "no such name" as slow as "wrong PIN".
let dummyHash = null;

/** Checks a name. Returns { name, key } or { error }. "Mel" and "mel" give the same key. */
export function cleanName(raw) {
  if (typeof raw !== "string") return { error: "Name must be text." };
  const name = raw.normalize("NFKC").replace(/\s+/g, " ").trim();
  const length = Array.from(name).length;   // counts emoji etc. as one character each
  if (length < 1 || length > MAX_NAME_LENGTH) return { error: `Name must be 1 to ${MAX_NAME_LENGTH} characters.` };
  if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(name)) return { error: "Name must be plain text." };
  return { name, key: name.toLowerCase() };
}

export function profileJson(row) {
  return {
    id: row.id,
    name: row.name,
    bestEndless: row.best_endless,
    gamesPlayed: row.games_played,
    totalCorrect: row.total_correct,
  };
}

async function startSession(env, profileId) {
  const token = randomHex(32);
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO sessions (token_hash, profile_id, created_at) VALUES (?1, ?2, ?3)").bind(await sha256Hex(token), profileId, now),
    // keep only the newest few signed-in devices
    env.DB.prepare("DELETE FROM sessions WHERE profile_id = ?1 AND token_hash NOT IN (SELECT token_hash FROM sessions WHERE profile_id = ?1 ORDER BY created_at DESC, rowid DESC LIMIT ?2)").bind(profileId, MAX_SESSIONS_PER_PROFILE),
  ]);
  return token;
}

function bearer(request) {
  const m = /^Bearer ([0-9a-f]{64})$/.exec(request.headers.get("Authorization") || "");
  return m ? m[1] : null;
}

/** The signed-in profile row for this request, or null. */
export async function authProfile(request, env) {
  const token = bearer(request);
  if (!token) return null;
  const oldest = Date.now() - SESSION_DAYS * 86400000;
  return await env.DB
    .prepare("SELECT p.* FROM sessions s JOIN profiles p ON p.id = s.profile_id WHERE s.token_hash = ?1 AND s.created_at > ?2")
    .bind(await sha256Hex(token), oldest)
    .first();
}

export function needSignIn(request) {
  return fail(request, 401, "Please sign in again.");
}

function checkCredentials(body) {
  const n = cleanName(body.name);
  if (n.error) return { error: n.error };
  if (typeof body.pin !== "string" || !PIN_PATTERN.test(body.pin)) return { error: "Your PIN must be 4 numbers." };
  return { name: n.name, key: n.key, pin: body.pin };
}

export async function handleCreate(request, env) {
  const bad = checkOrigin(request);
  if (bad) return bad;
  const gap = Number(env.CREATE_SECONDS ?? DEFAULT_SECONDS_BETWEEN_CREATES) * 1000;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const wait = createGap.wait(ip, gap);
  if (wait) return fail(request, 429, `Too quick! Please wait ${wait} seconds and try again.`, { "Retry-After": String(wait) });

  const read = await readJson(request);
  if (read.response) return read.response;
  const c = checkCredentials(read.body);
  if (c.error) return fail(request, 400, c.error);

  const taken = await env.DB.prepare("SELECT 1 AS x FROM profiles WHERE name_key = ?1").bind(c.key).first();
  if (taken) return fail(request, 409, "Someone already has that name. Please pick another one.");

  const created = new Date().toISOString();
  let id;
  try {
    const r = await env.DB
      .prepare("INSERT INTO profiles (name, name_key, pin_hash, created_at) VALUES (?1, ?2, ?3, ?4)")
      .bind(c.name, c.key, await hashPin(c.pin, env.PIN_PEPPER), created)
      .run();
    id = r.meta.last_row_id;
  } catch (e) {
    // two people picking the same name at the same moment
    return fail(request, 409, "Someone already has that name. Please pick another one.");
  }
  createGap.mark(ip, gap);

  const token = await startSession(env, id);
  const row = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?1").bind(id).first();
  return json(request, { ok: true, token, profile: profileJson(row) }, 201);
}

export async function handleLogin(request, env) {
  const bad = checkOrigin(request);
  if (bad) return bad;
  const read = await readJson(request);
  if (read.response) return read.response;
  const c = checkCredentials(read.body);
  // Same wording for a bad name, a bad PIN and an unknown player, so nobody can use it to look names up.
  const noMatch = () => fail(request, 401, "That name and PIN don't match. Please check them and try again.");
  if (c.error) return noMatch();

  const row = await env.DB.prepare("SELECT * FROM profiles WHERE name_key = ?1").bind(c.key).first();
  if (!row) {
    if (!dummyHash) dummyHash = await hashPin("0000", env.PIN_PEPPER);
    await checkPin(c.pin, dummyHash, env.PIN_PEPPER);
    return noMatch();
  }

  const now = Date.now();
  if (row.locked_until > now) {
    const mins = Math.ceil((row.locked_until - now) / 60000);
    return fail(request, 429, `Too many wrong PINs. This profile is locked for ${mins} more minute${mins === 1 ? "" : "s"}. Please try again later.`, { "Retry-After": String(mins * 60) });
  }

  if (!(await checkPin(c.pin, row.pin_hash, env.PIN_PEPPER))) {
    const wrong = row.failed_attempts + 1;
    if (wrong >= MAX_WRONG_PINS) {
      await env.DB.prepare("UPDATE profiles SET failed_attempts = 0, locked_until = ?2 WHERE id = ?1").bind(row.id, now + LOCK_MINUTES * 60000).run();
      return fail(request, 429, `Too many wrong PINs. This profile is locked for ${LOCK_MINUTES} minutes. Please try again later.`, { "Retry-After": String(LOCK_MINUTES * 60) });
    }
    await env.DB.prepare("UPDATE profiles SET failed_attempts = ?2 WHERE id = ?1").bind(row.id, wrong).run();
    const left = MAX_WRONG_PINS - wrong;
    return fail(request, 401, `That name and PIN don't match. ${left} ${left === 1 ? "try" : "tries"} left before this profile is locked for ${LOCK_MINUTES} minutes.`);
  }

  await env.DB.prepare("UPDATE profiles SET failed_attempts = 0, locked_until = 0 WHERE id = ?1").bind(row.id).run();
  const token = await startSession(env, row.id);
  return json(request, { ok: true, token, profile: profileJson(row) });
}

export async function handleLogout(request, env) {
  const bad = checkOrigin(request);
  if (bad) return bad;
  const token = bearer(request);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(await sha256Hex(token)).run();
  return json(request, { ok: true });
}

export async function handleMe(request, env) {
  const me = await authProfile(request, env);
  if (!me) return needSignIn(request);
  return json(request, { ok: true, profile: profileJson(me) });
}

// Tables with a profile_id column, emptied (in this order) before the profile itself goes.
export const PROFILE_TABLES = ["sessions"];

export async function handleDeleteMe(request, env) {
  const bad = checkOrigin(request);
  if (bad) return bad;
  const me = await authProfile(request, env);
  if (!me) return needSignIn(request);
  await env.DB.batch([
    ...PROFILE_TABLES.map((t) => env.DB.prepare(`DELETE FROM ${t} WHERE profile_id = ?1`).bind(me.id)),
    env.DB.prepare("DELETE FROM profiles WHERE id = ?1").bind(me.id),
  ]);
  return json(request, { ok: true });
}
