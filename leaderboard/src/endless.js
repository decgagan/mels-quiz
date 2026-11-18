// Endless mode (the main game): each finished run is saved against a profile.
//
//   POST /runs                        (signed in)  -> 201 { ok, saved, newBest, profile, rank, rankNoLifelines, scores }
//        body { runId, score, answered: {easy, medium, hard}, correct: {easy, medium, hard}, lifelines: [..] }
//   GET  /leaderboard/endless?board=overall|nolifelines  -> { ok, board, scores: [ top 10, one row per player ] }
//
// Keep the numbers in the "game rules" block in step with CONFIG at the top of game.js.

import { json, fail, checkOrigin, readJson, makeGap } from "./util.js";
import { authProfile, needSignIn, profileJson } from "./profiles.js";

// ---- game rules (must match CONFIG in game.js) ----
export const LIVES = 3;                                   // a run ends on the 3rd wrong answer or timeout
export const PRIZES = { easy: 100, medium: 250, hard: 500 };
export const BIG_EVERY = 10;                              // every 10th question is a forced hard one...
export const BIG_PRIZE = 1000;                            // ...worth this much
export const LIFELINES = ["removeWrong", "stopClock", "phoneFriend"];
export const LIFELINE_COST = 50;
export const SCORE_STEP = 25;                             // every amount in the game is a multiple of £25
// ---- sanity limits ----
export const MAX_QUESTIONS = 2000;                        // in one run
export const MAX_ENDLESS_SCORE = 1000000;
const TOP_N = 10;
const DEFAULT_SECONDS_BETWEEN_RUNS = 10;                  // per profile; 0 switches it off

const LEVELS = ["easy", "medium", "hard"];

function wholeNumber(n, max) {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= max;
}

/**
 * Checks a finished run. Returns { run } with tidy values, or { error }.
 * Because the game only sends a run when it is over, we know exactly how many answers were wrong (LIVES),
 * and the score can't be more than the right answers could have earned, minus what the lifelines cost.
 */
export function validateRun(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Send a JSON object." };
  if (typeof body.runId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(body.runId)) return { error: "That run has no valid id." };
  const answered = {}, correct = {};
  for (const [field, target] of [["answered", answered], ["correct", correct]]) {
    const o = body[field];
    if (!o || typeof o !== "object" || Array.isArray(o)) return { error: `Missing ${field} counts.` };
    for (const lv of LEVELS) {
      if (!wholeNumber(o[lv], MAX_QUESTIONS)) return { error: `The ${field} count for ${lv} isn't valid.` };
      target[lv] = o[lv];
    }
  }
  let totalAnswered = 0, totalCorrect = 0;
  for (const lv of LEVELS) {
    if (correct[lv] > answered[lv]) return { error: "More right answers than questions answered." };
    totalAnswered += answered[lv];
    totalCorrect += correct[lv];
  }
  if (totalAnswered > MAX_QUESTIONS) return { error: "Too many questions for one run." };
  if (totalAnswered - totalCorrect !== LIVES) return { error: "That run wasn't finished." };
  const bigCount = Math.floor(totalAnswered / BIG_EVERY);   // the 10th, 20th... questions were all hard
  if (answered.hard < bigCount) return { error: "Those counts don't add up." };

  if (!Array.isArray(body.lifelines) || body.lifelines.length > LIFELINES.length) return { error: "Lifelines must be a short list." };
  const lifelines = [];
  for (const l of body.lifelines) {
    if (!LIFELINES.includes(l) || lifelines.includes(l)) return { error: "Unknown lifeline." };
    lifelines.push(l);
  }
  lifelines.sort((a, b) => LIFELINES.indexOf(a) - LIFELINES.indexOf(b));

  const score = body.score;
  if (!wholeNumber(score, MAX_ENDLESS_SCORE)) return { error: "Score must be a whole number." };
  if (score % SCORE_STEP !== 0) return { error: `Score must be a multiple of ${SCORE_STEP}.` };
  const mostEarnable = correct.easy * PRIZES.easy + correct.medium * PRIZES.medium + correct.hard * PRIZES.hard
    + Math.min(correct.hard, bigCount) * (BIG_PRIZE - PRIZES.hard)
    - lifelines.length * LIFELINE_COST;
  if (score > mostEarnable) return { error: "That score is higher than those answers could win." };

  return { run: { runId: body.runId, score, answered, correct, lifelines, totalCorrect } };
}

const SELECT_ROWS = `
  SELECT name, score, created_at AS date, answered_easy, answered_medium, answered_hard, lifelines, profile_id
  FROM (
    SELECT p.name, r.score, r.created_at, r.id, r.profile_id, r.answered_easy, r.answered_medium, r.answered_hard, r.lifelines,
           ROW_NUMBER() OVER (PARTITION BY r.profile_id ORDER BY r.score DESC, r.created_at ASC, r.id ASC) AS rn
    FROM endless_runs r JOIN profiles p ON p.id = r.profile_id
    WHERE r.score > 0 AND (?1 = 0 OR r.lifelines = '')
  )
  WHERE rn = 1
  ORDER BY score DESC, created_at ASC, id ASC
  LIMIT ?2`;

/** Top 10, one row per player (their best run). board is "overall" or "nolifelines". */
export async function topEndless(env, board, meId) {
  const { results } = await env.DB.prepare(SELECT_ROWS).bind(board === "nolifelines" ? 1 : 0, TOP_N).all();
  return results.map((r) => ({
    name: r.name,
    score: r.score,
    date: r.date,
    answered: { easy: r.answered_easy, medium: r.answered_medium, hard: r.answered_hard },
    lifelines: r.lifelines ? r.lifelines.split(",") : [],
    me: meId !== undefined && meId !== null && r.profile_id === meId,
  }));
}

// 1 = top of the table. Players on the same score share a place.
async function placeOf(env, profileId, noLifelinesOnly) {
  const where = noLifelinesOnly ? "AND lifelines = ''" : "";
  const mine = await env.DB.prepare(`SELECT MAX(score) AS best FROM endless_runs WHERE profile_id = ?1 AND score > 0 ${where}`).bind(profileId).first();
  if (!mine || !mine.best) return null;
  const ahead = await env.DB
    .prepare(`SELECT COUNT(*) AS n FROM (SELECT profile_id FROM endless_runs WHERE score > 0 ${where} GROUP BY profile_id HAVING MAX(score) > ?1)`)
    .bind(mine.best)
    .first();
  return ahead.n + 1;
}

export async function handleGetBoard(request, env) {
  const url = new URL(request.url);
  const board = url.searchParams.get("board") === "nolifelines" ? "nolifelines" : "overall";
  const me = await authProfile(request, env);
  return json(request, { ok: true, board, scores: await topEndless(env, board, me ? me.id : null) });
}

const runGap = makeGap();

export async function handlePostRun(request, env) {
  const bad = checkOrigin(request);
  if (bad) return bad;
  const me = await authProfile(request, env);
  if (!me) return needSignIn(request);

  const read = await readJson(request);
  if (read.response) return read.response;
  const checked = validateRun(read.body);
  if (checked.error) return fail(request, 400, checked.error);
  const run = checked.run;

  const answer = async (profileRow, newBest, saved) => json(request, {
    ok: true,
    saved,
    newBest,
    profile: profileJson(profileRow),
    rank: await placeOf(env, me.id, false),
    rankNoLifelines: await placeOf(env, me.id, true),
    scores: await topEndless(env, "overall", me.id),
  }, saved ? 201 : 200);

  // The same run sent twice (a retry after a bad connection) is not saved twice.
  const already = await env.DB.prepare("SELECT 1 AS x FROM endless_runs WHERE profile_id = ?1 AND run_id = ?2").bind(me.id, run.runId).first();
  if (already) return await answer(me, false, false);

  // One run can't finish a few seconds after the last one.
  const gap = Number(env.RATE_LIMIT_SECONDS ?? DEFAULT_SECONDS_BETWEEN_RUNS) * 1000;
  const last = await env.DB.prepare("SELECT created_at FROM endless_runs WHERE profile_id = ?1 ORDER BY id DESC LIMIT 1").bind(me.id).first();
  if (gap > 0 && last) {
    const since = Date.now() - Date.parse(last.created_at);
    if (since < gap) {
      const wait = Math.ceil((gap - since) / 1000);
      return fail(request, 429, `Too quick! Please wait ${wait} seconds and try again.`, { "Retry-After": String(wait) });
    }
  }

  const newBest = run.score > me.best_endless;
  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO endless_runs (profile_id, run_id, score, answered_easy, answered_medium, answered_hard, correct_easy, correct_medium, correct_hard, lifelines, created_at)
                      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`)
        .bind(me.id, run.runId, run.score, run.answered.easy, run.answered.medium, run.answered.hard,
          run.correct.easy, run.correct.medium, run.correct.hard, run.lifelines.join(","), new Date().toISOString()),
      env.DB.prepare("UPDATE profiles SET games_played = games_played + 1, total_correct = total_correct + ?2, best_endless = MAX(best_endless, ?3) WHERE id = ?1")
        .bind(me.id, run.totalCorrect, run.score),
    ]);
  } catch (e) {
    return await answer(me, false, false);   // saved a moment ago by another request
  }
  const fresh = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?1").bind(me.id).first();
  return await answer(fresh, newBest, true);
}
