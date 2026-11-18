// Weekly challenge: 3 topics a week, 10 questions each, ONE run per profile per topic per week.
//
//   GET  /weekly/state                (sign in optional) -> { ok, week: { key, endsAt }, runs: [ { slot, status, score, correct, wrong, noLifelines } ] }
//   POST /weekly/start   { slot }     (signed in) -> 201 { ok, week, slot }   or 409 if that topic was already started this week
//   POST /weekly/finish  { slot, score, correct, wrong, lifelines } (signed in) -> { ok, score, rank, profile, scores }
//   GET  /weekly/leaderboard?slot=0   -> { ok, week, slot, scores: [ top 10 for this week and topic ] }
//
// The week is worked out HERE, from the Worker's clock, in UK time (Europe/London): it runs from Monday 00:00 to
// the next Monday 00:00. The questions themselves live in weekly.js on the website, keyed by the same Monday date.
// A run is recorded when it STARTS, so refreshing the page or leaving never gives a second go.

import { json, fail, checkOrigin, readJson } from "./util.js";
import { authProfile, needSignIn, profileJson } from "./profiles.js";
import { LIFELINES, LIFELINE_COST, SCORE_STEP } from "./endless.js";

// ---- game rules (must match weekly.js and CONFIG.weekly in game.js) ----
export const WEEKLY_SLOTS = 3;             // topics a week
export const WEEKLY_QUESTIONS = 10;        // questions in each
export const WEEKLY_MAX_PRIZE = 250;       // the biggest prize a weekly question is worth (medium)
// ---- sanity limits ----
const DEFAULT_MIN_RUN_SECONDS = 15;        // ten questions can't honestly be answered faster than this (env WEEKLY_MIN_SECONDS overrides, for tests)
const MAX_RUN_MINUTES = 180;               // a run that has been open longer than this can't be finished
const TOP_N = 10;

// ---------------------------------------------------------------- the week
const WEEKDAYS = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

/** The UK date and time for a moment, as numbers. */
export function londonParts(ms) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", hourCycle: "h23", weekday: "short",
  });
  const p = {};
  for (const part of f.formatToParts(new Date(ms))) p[part.type] = part.value;
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour, minute: +p.minute, weekday: WEEKDAYS[p.weekday] };
}

// The exact moment it is 00:00 in London on this calendar date (month is 0-11). UK clocks are 0 or 1 hour from UTC.
function londonMidnight(y, m, d) {
  for (const offset of [0, 3600000]) {
    const t = Date.UTC(y, m, d) - offset;
    const p = londonParts(t);
    if (p.day === d && p.hour === 0 && p.minute === 0) return t;
  }
  return Date.UTC(y, m, d);
}

const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10);

/** { key: "2026-11-16", endsAt: ISO time } for the UK week that contains `nowMs`. */
export function weekInfo(nowMs = Date.now()) {
  const p = londonParts(nowMs);
  const monday = Date.UTC(p.year, p.month - 1, p.day - p.weekday);
  const nextMonday = new Date(monday + 7 * 86400000);
  const endsAt = londonMidnight(nextMonday.getUTCFullYear(), nextMonday.getUTCMonth(), nextMonday.getUTCDate());
  return { key: isoDate(monday), endsAt: new Date(endsAt).toISOString() };
}

// ---------------------------------------------------------------- checks
export function validateSlot(slot) {
  return Number.isInteger(slot) && slot >= 0 && slot < WEEKLY_SLOTS;
}

/** Checks a finished weekly run. Returns { run } or { error }. */
export function validateFinish(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Send a JSON object." };
  if (!validateSlot(body.slot)) return { error: "Unknown topic." };
  const { correct, wrong, score } = body;
  const whole = (n, max) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= max;
  if (!whole(correct, WEEKLY_QUESTIONS) || !whole(wrong, WEEKLY_QUESTIONS) || correct + wrong !== WEEKLY_QUESTIONS) return { error: "That run wasn't finished." };
  if (!Array.isArray(body.lifelines) || body.lifelines.length > LIFELINES.length) return { error: "Lifelines must be a short list." };
  const lifelines = [];
  for (const l of body.lifelines) {
    if (!LIFELINES.includes(l) || lifelines.includes(l)) return { error: "Unknown lifeline." };
    lifelines.push(l);
  }
  lifelines.sort((a, b) => LIFELINES.indexOf(a) - LIFELINES.indexOf(b));
  if (!whole(score, WEEKLY_QUESTIONS * WEEKLY_MAX_PRIZE)) return { error: "Score must be a whole number." };
  if (score % SCORE_STEP !== 0) return { error: `Score must be a multiple of ${SCORE_STEP}.` };
  if (score > correct * WEEKLY_MAX_PRIZE - lifelines.length * LIFELINE_COST) return { error: "That score is higher than those answers could win." };
  return { run: { slot: body.slot, score, correct, wrong, lifelines } };
}

// ---------------------------------------------------------------- handlers
function runJson(r) {
  return {
    slot: r.slot,
    status: r.finished_at ? "finished" : "started",
    score: r.score,
    correct: r.correct,
    wrong: r.wrong,
    noLifelines: r.lifelines === "",
  };
}

export async function handleState(request, env) {
  const week = weekInfo();
  const me = await authProfile(request, env);
  let runs = [];
  if (me) {
    const { results } = await env.DB
      .prepare("SELECT * FROM weekly_runs WHERE profile_id = ?1 AND week_key = ?2 ORDER BY slot")
      .bind(me.id, week.key)
      .all();
    runs = results.map(runJson);
  }
  return json(request, { ok: true, week, signedIn: !!me, runs });
}

export async function handleStart(request, env) {
  const bad = checkOrigin(request);
  if (bad) return bad;
  const me = await authProfile(request, env);
  if (!me) return needSignIn(request);
  const read = await readJson(request);
  if (read.response) return read.response;
  if (!validateSlot(read.body.slot)) return fail(request, 400, "Unknown topic.");

  const week = weekInfo();
  try {
    await env.DB
      .prepare("INSERT INTO weekly_runs (profile_id, week_key, slot, started_at) VALUES (?1, ?2, ?3, ?4)")
      .bind(me.id, week.key, read.body.slot, new Date().toISOString())
      .run();
  } catch (e) {
    // the UNIQUE (profile, week, topic) rule: this topic has been started already
    return fail(request, 409, "You've already had your go at this topic this week.");
  }
  return json(request, { ok: true, week: week.key, slot: read.body.slot }, 201);
}

async function topWeekly(env, weekKey, slot, meId) {
  const { results } = await env.DB
    .prepare(`SELECT p.name, w.score, w.correct, w.lifelines, w.profile_id
              FROM weekly_runs w JOIN profiles p ON p.id = w.profile_id
              WHERE w.week_key = ?1 AND w.slot = ?2 AND w.finished_at IS NOT NULL AND w.score > 0
              ORDER BY w.score DESC, w.finished_at ASC, w.id ASC LIMIT ?3`)
    .bind(weekKey, slot, TOP_N)
    .all();
  return results.map((r) => ({ name: r.name, score: r.score, correct: r.correct, noLifelines: r.lifelines === "", me: meId !== undefined && meId !== null && r.profile_id === meId }));
}

export async function handleLeaderboard(request, env) {
  const url = new URL(request.url);
  const slot = Number(url.searchParams.get("slot"));
  if (!validateSlot(slot)) return fail(request, 400, "Unknown topic.");
  const me = await authProfile(request, env);
  const week = weekInfo();
  return json(request, { ok: true, week: week.key, slot, scores: await topWeekly(env, week.key, slot, me ? me.id : null) });
}

export async function handleFinish(request, env) {
  const bad = checkOrigin(request);
  if (bad) return bad;
  const me = await authProfile(request, env);
  if (!me) return needSignIn(request);
  const read = await readJson(request);
  if (read.response) return read.response;
  const checked = validateFinish(read.body);
  if (checked.error) return fail(request, 400, checked.error);
  const run = checked.run;

  // The run that was started and not yet finished. (If this was sent twice, the second time finds it finished.)
  const open = await env.DB
    .prepare("SELECT * FROM weekly_runs WHERE profile_id = ?1 AND slot = ?2 AND (week_key = ?3 OR finished_at IS NULL) ORDER BY id DESC LIMIT 1")
    .bind(me.id, run.slot, weekInfo().key)
    .first();
  const reply = async (row, saved) => {
    const fresh = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?1").bind(me.id).first();
    const ahead = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM weekly_runs WHERE week_key = ?1 AND slot = ?2 AND finished_at IS NOT NULL AND score > ?3")
      .bind(row.week_key, row.slot, row.score)
      .first();
    return json(request, {
      ok: true, saved, score: row.score, week: row.week_key,
      rank: row.score > 0 ? ahead.n + 1 : null,
      profile: profileJson(fresh),
      scores: await topWeekly(env, row.week_key, row.slot, me.id),
    });
  };
  if (!open) return fail(request, 404, "That run isn't open. Start the topic first.");
  if (open.finished_at) return await reply(open, false);

  const started = Date.parse(open.started_at);
  const seconds = (Date.now() - started) / 1000;
  const minSeconds = Number(env.WEEKLY_MIN_SECONDS ?? DEFAULT_MIN_RUN_SECONDS);
  if (seconds < minSeconds) {
    // Not a refusal for good: the game's "Try saving again" button works a few seconds later.
    const wait = Math.ceil(minSeconds - seconds);
    return fail(request, 429, `Just a moment! Please try saving again in ${wait} second${wait === 1 ? "" : "s"}.`, { "Retry-After": String(wait) });
  }
  if (seconds > MAX_RUN_MINUTES * 60) return fail(request, 400, "That run was open for too long to count.");

  const done = await env.DB.batch([
    env.DB.prepare("UPDATE weekly_runs SET finished_at = ?2, score = ?3, correct = ?4, wrong = ?5, lifelines = ?6 WHERE id = ?1 AND finished_at IS NULL")
      .bind(open.id, new Date().toISOString(), run.score, run.correct, run.wrong, run.lifelines.join(",")),
  ]);
  if (done[0].meta.changes === 1) {
    await env.DB.prepare("UPDATE profiles SET total_correct = total_correct + ?2 WHERE id = ?1").bind(me.id, run.correct).run();
  }
  const row = await env.DB.prepare("SELECT * FROM weekly_runs WHERE id = ?1").bind(open.id).first();
  return await reply(row, done[0].meta.changes === 1);
}
