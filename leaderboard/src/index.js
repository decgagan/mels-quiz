/**
 * Mel's Quiz leaderboard - a tiny Cloudflare Worker with a D1 database.
 *
 *   GET  /scores  -> { scores: [ { id, name, score, date } ... ] }   (top 10)
 *   POST /scores  -> body { "name": "Dec", "score": 1250 }
 *                    -> 201 { ok, entry: { id, name, score, date, rank }, scores: [...top 10] }
 *
 * (This is the ORIGINAL leaderboard. The player profiles are in profiles.js.)
 * Nothing is stored except the name, the score and the date. IP addresses are NOT stored.
 */

import { originAllowed, corsHeaders, json, fail } from "./util.js";
import { handleGetBoard, handlePostRun } from "./endless.js";
import { handleCreate, handleLogin, handleLogout, handleMe, handleDeleteMe } from "./profiles.js";

// ---- Settings for the LEGACY leaderboard (the original 10-question game): 10 questions x the biggest prize, £500 ----
const MAX_NAME_LENGTH = 20;
const MAX_SCORE = 5000;                                    // 10 x £500
const SCORE_STEP = 25;                                     // every score in the game is a multiple of £25
const TOP_N = 10;
const MAX_BODY_BYTES = 1024;
const DEFAULT_SECONDS_BETWEEN_SUBMITS = 10;                // per IP address; set to 0 to switch the limit off

// Remember when each IP last submitted. This lives in the Worker's memory only (nothing is saved),
// so it's a simple best-effort guard against button-mashing, not a hard guarantee.
const lastSubmitByIp = new Map();

/** Checks a submission. Returns { name, score } or { error }. */
export function validate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Send a JSON object with a name and a score." };
  if (typeof body.name !== "string") return { error: "Name must be text." };
  const name = body.name.trim();
  const length = Array.from(name).length;   // counts emoji etc. as one character each
  if (length < 1 || length > MAX_NAME_LENGTH) return { error: `Name must be 1 to ${MAX_NAME_LENGTH} characters.` };
  if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(name)) return { error: "Name must be plain text." };
  const score = body.score;
  if (typeof score !== "number" || !Number.isInteger(score)) return { error: "Score must be a whole number." };
  if (score < 1 || score > MAX_SCORE) return { error: `Score must be between 1 and ${MAX_SCORE}.` };
  if (score % SCORE_STEP !== 0) return { error: `Score must be a multiple of ${SCORE_STEP}.` };
  return { name, score };
}

async function topScores(env) {
  const { results } = await env.DB
    .prepare("SELECT id, name, score, created_at AS date FROM scores ORDER BY score DESC, created_at ASC, id ASC LIMIT ?1")
    .bind(TOP_N)
    .all();
  return results;
}

async function handleGet(request, env) {
  return json(request, { scores: await topScores(env) });
}

async function handlePost(request, env) {
  // Browsers always send Origin on cross-site POSTs; refuse ones from other websites.
  const origin = request.headers.get("Origin");
  if (origin && !originAllowed(origin)) return fail(request, 403, "This website isn't allowed to add scores.");

  // Per-IP rate limit (best effort, in memory). Only successful submissions start the clock,
  // so fixing a typo and trying again straight away is fine.
  const gap = Number(env.RATE_LIMIT_SECONDS ?? DEFAULT_SECONDS_BETWEEN_SUBMITS) * 1000;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (gap > 0) {
    const last = lastSubmitByIp.get(ip);
    if (last !== undefined && Date.now() - last < gap) {
      const wait = Math.ceil((gap - (Date.now() - last)) / 1000);
      return fail(request, 429, `Too quick! Please wait ${wait} seconds and try again.`, { "Retry-After": String(wait) });
    }
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return fail(request, 413, "That request is too big.");
  let body;
  try { body = JSON.parse(text); } catch (e) { return fail(request, 400, "Send JSON like {\"name\":\"Mel\",\"score\":500}."); }

  const checked = validate(body);
  if (checked.error) return fail(request, 400, checked.error);

  const date = new Date().toISOString();
  const insert = await env.DB
    .prepare("INSERT INTO scores (name, score, created_at) VALUES (?1, ?2, ?3)")
    .bind(checked.name, checked.score, date)
    .run();
  const id = insert.meta.last_row_id;

  if (gap > 0) {
    const now = Date.now();
    if (lastSubmitByIp.size > 1000) {
      for (const [k, t] of lastSubmitByIp) if (now - t > gap) lastSubmitByIp.delete(k);
    }
    lastSubmitByIp.set(ip, now);
  }

  // Where did it land? (1 = top of the table; ties go to whoever got there first.)
  const ahead = await env.DB
    .prepare("SELECT COUNT(*) AS n FROM scores WHERE score > ?1 OR (score = ?1 AND (created_at < ?2 OR (created_at = ?2 AND id < ?3)))")
    .bind(checked.score, date, id)
    .first();

  return json(request, {
    ok: true,
    entry: { id, name: checked.name, score: checked.score, date, rank: ahead.n + 1 },
    scores: await topScores(env),
  }, 201);
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, "") || "/";

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(request) });
      }
      const get = request.method === "GET", post = request.method === "POST";

      // Player profiles
      if (path === "/profiles" && post) return await handleCreate(request, env);
      if (path === "/login" && post) return await handleLogin(request, env);
      if (path === "/logout" && post) return await handleLogout(request, env);
      if (path === "/me" && get) return await handleMe(request, env);
      if (path === "/me/delete" && post) return await handleDeleteMe(request, env);

      // Endless mode (the main game)
      if (path === "/runs" && post) return await handlePostRun(request, env);
      if (path === "/leaderboard/endless" && get) return await handleGetBoard(request, env);

      // The original leaderboard. Kept so the old version of the game keeps working until it is updated.
      if (path === "/scores" && get) return await handleGet(request, env);
      if (path === "/scores" && post) return await handlePost(request, env);
      if (path === "/") return json(request, { ok: true, name: "mels-quiz-leaderboard", try: "/scores" });
      return fail(request, 404, "Not found.");
    } catch (err) {
      return fail(request, 500, "Something went wrong on the server.");
    }
  },
};
