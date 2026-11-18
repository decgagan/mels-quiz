// A player's own stats page, worked out from their saved runs.
//
//   GET /me/stats   (signed in) -> { ok, stats }
//
// Everything comes from the endless_runs and weekly_runs tables, so it always matches what is on the leaderboards.
// Runs saved before migration 0005 have no level / big-question detail; those are left out of the particular
// stats that need it (they still count towards totals), and anything with no data at all comes back as null,
// which the game shows as a dash.

import { json } from "./util.js";
import { authProfile, needSignIn } from "./profiles.js";
import { LIFELINES, BIG_EVERY } from "./endless.js";

const n = (v) => (typeof v === "number" ? v : 0);

export async function playerStats(env, profile) {
  const lifelineSums = LIFELINES.map((l) => `COALESCE(SUM(lifelines LIKE '%${l}%'), 0) AS ll_${l}`).join(", ");
  const endless = await env.DB.prepare(`
    SELECT COUNT(*) AS games,
           COALESCE(SUM(score), 0) AS money,
           MAX(score) AS best,
           AVG(score) AS average,
           MAX(answered_easy + answered_medium + answered_hard) AS longest,
           COALESCE(SUM(answered_easy), 0) AS a_easy, COALESCE(SUM(answered_medium), 0) AS a_medium, COALESCE(SUM(answered_hard), 0) AS a_hard,
           COALESCE(SUM(correct_easy), 0) AS c_easy, COALESCE(SUM(correct_medium), 0) AS c_medium, COALESCE(SUM(correct_hard), 0) AS c_hard,
           COALESCE(SUM(CASE WHEN big_correct IS NOT NULL THEN (answered_easy + answered_medium + answered_hard) / ${BIG_EVERY} END), 0) AS big_answered,
           COALESCE(SUM(big_correct), 0) AS big_correct,
           ${lifelineSums}
    FROM endless_runs WHERE profile_id = ?1`).bind(profile.id).first();
  const weekly = await env.DB.prepare(`
    SELECT COUNT(*) AS runs,
           COALESCE(SUM(score), 0) AS money,
           MAX(score) AS best,
           COALESCE(SUM(correct), 0) AS correct, COALESCE(SUM(wrong), 0) AS wrong,
           COALESCE(SUM(CASE WHEN answered_easy IS NOT NULL THEN answered_easy END), 0) AS a_easy,
           COALESCE(SUM(CASE WHEN answered_easy IS NOT NULL THEN 10 - answered_easy END), 0) AS a_medium,
           COALESCE(SUM(correct_easy), 0) AS c_easy, COALESCE(SUM(correct_medium), 0) AS c_medium,
           ${lifelineSums}
    FROM weekly_runs WHERE profile_id = ?1 AND finished_at IS NOT NULL`).bind(profile.id).first();

  const endlessAnswered = n(endless.a_easy) + n(endless.a_medium) + n(endless.a_hard);
  const endlessCorrect = n(endless.c_easy) + n(endless.c_medium) + n(endless.c_hard);
  const weeklyAnswered = n(weekly.correct) + n(weekly.wrong);
  const answered = endlessAnswered + weeklyAnswered;
  const correct = endlessCorrect + n(weekly.correct);

  const lifelines = {};
  let lifelinesTotal = 0;
  for (const l of LIFELINES) {
    lifelines[l] = n(endless[`ll_${l}`]) + n(weekly[`ll_${l}`]);
    lifelinesTotal += lifelines[l];
  }

  return {
    memberSince: profile.created_at,
    questions: { answered, correct, accuracy: answered > 0 ? Math.round((correct / answered) * 100) : null },
    money: { total: n(endless.money) + n(weekly.money), endless: n(endless.money), weekly: n(weekly.money) },
    endless: {
      games: n(endless.games),
      best: endless.games > 0 ? n(endless.best) : null,
      average: endless.games > 0 ? Math.round(endless.average) : null,
      longestRun: endless.games > 0 ? n(endless.longest) : null,
      questions: endlessAnswered,
      correct: endlessCorrect,
    },
    // endless + weekly together. Weekly runs saved before migration 0005 aren't split by level, so they are left out here.
    byLevel: {
      easy:   { answered: n(endless.a_easy) + n(weekly.a_easy),     correct: n(endless.c_easy) + n(weekly.c_easy) },
      medium: { answered: n(endless.a_medium) + n(weekly.a_medium), correct: n(endless.c_medium) + n(weekly.c_medium) },
      hard:   { answered: n(endless.a_hard),                        correct: n(endless.c_hard) },   // hard questions only appear in endless; includes the big ones
    },
    big: { answered: n(endless.big_answered), correct: n(endless.big_correct) },
    lifelines: { ...lifelines, total: lifelinesTotal },
    weekly: {
      runs: n(weekly.runs),
      best: weekly.runs > 0 ? n(weekly.best) : null,
      winnings: n(weekly.money),
      correct: n(weekly.correct),
      wrong: n(weekly.wrong),
    },
  };
}

export async function handleStats(request, env) {
  const me = await authProfile(request, env);
  if (!me) return needSignIn(request);
  return json(request, { ok: true, stats: await playerStats(env, me) });
}
