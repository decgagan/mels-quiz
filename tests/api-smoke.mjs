// Talks to a RUNNING Worker and checks the main flows. Needs a local Worker:
//   cd leaderboard
//   npx wrangler d1 migrations apply mels-quiz-scores --local
//   npx wrangler dev --var CREATE_SECONDS:0 RATE_LIMIT_SECONDS:0 WEEKLY_MIN_SECONDS:3
// then, in another window:   node tests/api-smoke.mjs   (or: node tests/api-smoke.mjs http://localhost:8787)
// It makes up throwaway players with random names and deletes them again, so it is safe to run more than once.
// Use a FRESH local database: it checks things like "rank 1", which other players on the boards would change.
// NEVER point it at the live Worker.

const BASE = (process.argv[2] || "http://localhost:8787").replace(/\/+$/, "");
const ORIGIN = "http://localhost:8000";
let failures = 0;
function ok(cond, msg) { if (cond) console.log("  ok:", msg); else { failures++; console.log("  FAIL:", msg); } }

async function call(method, path, body, token) {
  const headers = { Origin: ORIGIN };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = "Bearer " + token;
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let data = null;
  try { data = await res.json(); } catch (e) { /* not JSON */ }
  return { status: res.status, data, headers: res.headers };
}

const tag = Math.random().toString(36).slice(2, 7);
const NAME = "Test " + tag;

async function profiles() {
  console.log("Profiles");
  let r = await call("POST", "/profiles", { name: NAME, pin: "1234" });
  ok(r.status === 201 && /^[0-9a-f]{64}$/.test(r.data.token), "create profile returns a 64-character token");
  const token = r.data.token;
  ok(r.data.profile.name === NAME && r.data.profile.gamesPlayed === 0, "new profile has zero stats");
  ok(!JSON.stringify(r.data).includes("1234") && !("pin_hash" in r.data.profile), "reply never contains the PIN or its hash");
  r = await call("POST", "/profiles", { name: NAME.toUpperCase(), pin: "9999" });
  ok(r.status === 409, "same name in different case is refused");
  r = await call("POST", "/profiles", { name: "x" + tag, pin: "12a4" });
  ok(r.status === 400, "PIN with a letter is refused");
  r = await call("POST", "/profiles", { name: "x" + tag, pin: "123" });
  ok(r.status === 400, "3-digit PIN is refused");
  r = await call("POST", "/profiles", { name: "", pin: "1234" });
  ok(r.status === 400, "empty name is refused");
  r = await call("POST", "/profiles", { name: "a".repeat(21), pin: "1234" });
  ok(r.status === 400, "21-character name is refused");
  r = await call("GET", "/me", undefined, token);
  ok(r.status === 200 && r.data.profile.name === NAME, "GET /me with the token works");
  r = await call("GET", "/me");
  ok(r.status === 401, "GET /me with no token is 401");
  r = await call("GET", "/me", undefined, "0".repeat(64));
  ok(r.status === 401, "GET /me with a made-up token is 401");

  r = await call("POST", "/login", { name: NAME.toLowerCase(), pin: "1234" });
  ok(r.status === 200 && r.data.token && r.data.token !== token, "sign in on another device (any case) gives a new token");
  const token2 = r.data.token;
  r = await call("POST", "/logout", {}, token2);
  r = await call("GET", "/me", undefined, token2);
  ok(r.status === 401, "after sign out that token stops working");
  r = await call("GET", "/me", undefined, token);
  ok(r.status === 200, "the other device is still signed in");

  r = await call("POST", "/login", { name: "nobody " + tag, pin: "1234" });
  ok(r.status === 401, "unknown name gives the same 401");
  for (let i = 1; i <= 4; i++) {
    r = await call("POST", "/login", { name: NAME, pin: "0000" });
    ok(r.status === 401, `wrong PIN ${i} is 401`);
  }
  r = await call("POST", "/login", { name: NAME, pin: "0000" });
  ok(r.status === 429, "5th wrong PIN locks the profile (429)");
  r = await call("POST", "/login", { name: NAME, pin: "1234" });
  ok(r.status === 429, "even the right PIN is refused while locked");

  r = await call("POST", "/profiles", { name: "Blocked " + tag, pin: "1234" }, undefined);
  const t3 = r.data.token;
  r = await call("POST", "/me/delete", {}, t3);
  ok(r.status === 200, "delete my profile works");
  r = await call("GET", "/me", undefined, t3);
  ok(r.status === 401, "token stops working after delete");
  r = await call("POST", "/login", { name: "Blocked " + tag, pin: "1234" });
  ok(r.status === 401, "deleted profile can't sign in");
  r = await call("POST", "/profiles", { name: "Blocked " + tag, pin: "4321" });
  ok(r.status === 201, "the name is free again after delete");
  await call("POST", "/me/delete", {}, r.data.token);
  return token;
}

function run(over = {}) {
  // 12 questions: 2 easy (1 right), 3 medium (2 right), 7 hard (6 right, incl. the 10th)... 3 wrong in total
  return Object.assign({
    runId: "run-" + Math.random().toString(36).slice(2, 12),
    score: 0,
    answered: { easy: 2, medium: 3, hard: 7 },
    correct: { easy: 1, medium: 2, hard: 6 },
    lifelines: [],
  }, over);
}

async function endless() {
  console.log("Endless runs and leaderboards");
  const mk = async (n) => (await call("POST", "/profiles", { name: n + " " + tag, pin: "1111" })).data.token;
  const a = await mk("Ann"), b = await mk("Bob"), c = await mk("Cat");

  let r = await call("POST", "/runs", run({ score: 100 }));
  ok(r.status === 401, "saving a run needs a sign-in");
  // 1x100 + 2x250 + 6x500 + 500 bonus for the 10th question = 4100
  r = await call("POST", "/runs", run({ score: 4100 }), a);
  ok(r.status === 201 && r.data.saved && r.data.newBest, "valid run saves (score 4100, the most those answers could win)");
  ok(r.data.profile.gamesPlayed === 1 && r.data.profile.totalCorrect === 9 && r.data.profile.bestEndless === 4100, "profile stats updated");
  ok(r.data.rank === 1 && r.data.rankNoLifelines === 1, "rank 1 overall and with no lifelines");
  r = await call("POST", "/runs", run({ score: 4125 }), a);
  ok(r.status === 400, "score above what the answers could win is refused");
  r = await call("POST", "/runs", run({ score: 4090 }), a);
  ok(r.status === 400, "score not a multiple of 25 is refused");
  r = await call("POST", "/runs", run({ score: 3000, correct: { easy: 1, medium: 2, hard: 5 } }), a);
  ok(r.status === 400, "run that didn't end on the 3rd wrong answer is refused");
  r = await call("POST", "/runs", run({ lifelines: ["x"] }), a);
  ok(r.status === 400, "unknown lifeline is refused");
  r = await call("POST", "/runs", run({ answered: { easy: 5, medium: 5, hard: 0 }, correct: { easy: 3, medium: 4, hard: 0 } }), a);
  ok(r.status === 400, "10 questions with no hard one is refused (the 10th must be hard)");
  const dup = run({ score: 100 });
  r = await call("POST", "/runs", dup, b);
  ok(r.status === 201, "second player saves a run (score 100)");
  r = await call("POST", "/runs", dup, b);
  ok(r.status === 200 && r.data.saved === false, "the same run sent again is not saved twice");
  r = await call("GET", "/me", undefined, b);
  ok(r.data.profile.gamesPlayed === 1, "games played still 1 after the retry");

  // Cat: used Ask Dec, scored 3600 (4100 - 50 - rounded: 4050 is the cap with one lifeline)
  r = await call("POST", "/runs", run({ score: 4050, lifelines: ["phoneFriend"] }), c);
  ok(r.status === 201 && r.data.rank === 2 && r.data.rankNoLifelines === null, "lifeline run: rank 2 overall, no no-lifelines rank");
  r = await call("POST", "/runs", run({ score: 4100, lifelines: ["phoneFriend"] }), c);
  ok(r.status === 400, "lifeline cost is taken off the most a run could win");

  r = await call("GET", "/leaderboard/endless?board=overall", undefined, c);
  const mine = r.data.scores.filter((x) => x.name.endsWith(tag));
  ok(r.status === 200 && mine.length === 3 && mine[0].name.startsWith("Ann") && mine[1].name.startsWith("Cat") && mine[2].name.startsWith("Bob"), "overall board orders Ann 4100, Cat 4050, Bob 100");
  ok(mine[1].me === true && mine[0].me === false, "'me' flag marks the signed-in player's row");
  ok(mine[1].lifelines.join() === "phoneFriend" && mine[0].answered.hard === 7, "rows carry lifelines used and answered counts");
  r = await call("GET", "/leaderboard/endless?board=nolifelines");
  const nl = r.data.scores.filter((x) => x.name.endsWith(tag));
  ok(nl.length === 2 && nl.every((x) => x.lifelines.length === 0), "no-lifelines board leaves Cat out");
  // a player's second, worse run doesn't add a second row
  await call("POST", "/runs", run({ score: 50 }), a);
  r = await call("GET", "/leaderboard/endless?board=overall");
  ok(r.data.scores.filter((x) => x.name.startsWith("Ann " + tag)).length === 1, "one row per player (their best)");
  r = await call("GET", "/me", undefined, a);
  ok(r.data.profile.gamesPlayed === 2 && r.data.profile.bestEndless === 4100, "games played 2, best still 4100");

  // old leaderboard untouched
  r = await call("GET", "/scores");
  ok(r.status === 200 && Array.isArray(r.data.scores), "legacy GET /scores still works");

  for (const t of [a, b, c]) await call("POST", "/me/delete", {}, t);
  r = await call("GET", "/leaderboard/endless?board=overall");
  ok(!r.data.scores.some((x) => x.name.endsWith(tag)), "deleting profiles removes their scores");
}

async function weekly() {
  console.log("Weekly challenge");
  const mk = async (n) => (await call("POST", "/profiles", { name: n + " " + tag, pin: "2222" })).data.token;
  const a = await mk("Wa"), b = await mk("Wb");
  let r = await call("GET", "/weekly/state");
  ok(r.status === 200 && /^\d{4}-\d{2}-\d{2}$/.test(r.data.week.key) && r.data.signedIn === false && r.data.runs.length === 0, "state works signed out and gives the week key");
  const week = r.data.week.key;
  ok(new Date(week + "T12:00:00Z").getUTCDay() === 1, "week key is a Monday");
  r = await call("POST", "/weekly/start", { slot: 0 });
  ok(r.status === 401, "starting needs a sign-in");
  r = await call("POST", "/weekly/start", { slot: 3 }, a);
  ok(r.status === 400, "unknown topic refused");
  r = await call("POST", "/weekly/start", { slot: 1 }, a);
  ok(r.status === 201 && r.data.week === week, "start topic 1");
  r = await call("POST", "/weekly/start", { slot: 1 }, a);
  ok(r.status === 409, "starting the same topic again is refused (no retry)");
  r = await call("GET", "/weekly/state", undefined, a);
  ok(r.data.runs.length === 1 && r.data.runs[0].slot === 1 && r.data.runs[0].status === "started", "state shows topic 1 as started");
  r = await call("POST", "/weekly/finish", { slot: 1, score: 1000, correct: 6, wrong: 4, lifelines: [] }, a);
  ok(r.status === 429 && /just a moment/i.test(r.data.error), "finishing instantly is told to wait (this local Worker uses a 3 second minimum; the real one 15)");
  r = await call("POST", "/weekly/finish", { slot: 0, score: 0, correct: 0, wrong: 10, lifelines: [] }, a);
  ok(r.status === 404, "can't finish a topic that wasn't started");
  await new Promise((res) => setTimeout(res, 3300));
  r = await call("POST", "/weekly/finish", { slot: 1, score: 1600, correct: 6, wrong: 4, lifelines: [] }, a);
  ok(r.status === 400, "score above the maximum refused");
  r = await call("POST", "/weekly/finish", { slot: 1, score: 1250, correct: 6, wrong: 4, lifelines: [] }, a);
  ok(r.status === 200 && r.data.saved === true && r.data.score === 1250 && r.data.rank === 1, "finish saves the score, rank 1");
  r = await call("POST", "/weekly/finish", { slot: 1, score: 1500, correct: 6, wrong: 4, lifelines: [] }, a);
  ok(r.status === 200 && r.data.saved === false && r.data.score === 1250, "finishing again keeps the first score");
  r = await call("POST", "/weekly/start", { slot: 1 }, a);
  ok(r.status === 409, "still no retry after finishing");
  r = await call("GET", "/me", undefined, a);
  ok(r.data.profile.totalCorrect === 6 && r.data.profile.gamesPlayed === 0, "total correct goes up by 6; games played (endless) unchanged");

  await call("POST", "/weekly/start", { slot: 1 }, b);
  r = await call("POST", "/weekly/start", { slot: 2 }, a);
  ok(r.status === 201, "the same player can start a different topic");
  await new Promise((res) => setTimeout(res, 3300));
  r = await call("POST", "/weekly/finish", { slot: 1, score: 1350, correct: 6, wrong: 4, lifelines: ["stopClock"] }, b);
  ok(r.status === 200, "valid run with a lifeline saves (6 right, one lifeline: up to £1,450)");
  r = await call("POST", "/weekly/finish", { slot: 2, score: 900, correct: 5, wrong: 5, lifelines: ["phoneFriend"] }, a);
  ok(r.status === 200 && r.data.saved === true, "a second topic run by the same player saves too");
  ok(r.data.scores.filter((x) => x.name.endsWith(tag)).length === 3, "the finish reply carries the same combined board");
  r = await call("GET", "/weekly/leaderboard", undefined, b);
  const rows = r.data.scores.filter((x) => x.name.endsWith(tag));
  ok(rows.length === 3, "one weekly board holds every topic run: " + rows.length + " rows for our two players");
  ok(rows[0].name.startsWith("Wb") && rows[0].slot === 1 && rows[0].score === 1350, "top row: Wb, topic 1, 1350");
  ok(rows[1].name.startsWith("Wa") && rows[1].slot === 1 && rows[1].score === 1250, "next: Wa, topic 1, 1250");
  ok(rows[2].name.startsWith("Wa") && rows[2].slot === 2 && rows[2].score === 900, "and Wa again, topic 2, 900 (a player can appear once per topic)");
  ok(rows[0].me === true && rows[1].me === false && rows[0].noLifelines === false && rows[1].noLifelines === true && rows[2].noLifelines === false, "'me' and no-lifelines flags");
  ok(r.data.scores.length <= 10 && typeof r.data.week === "string", "top 10 at most, with the week key");
  r = await call("GET", "/weekly/leaderboard?slot=9");
  ok(r.status === 200, "an old-style ?slot= is simply ignored (one board now)");
  r = await call("GET", "/weekly/state", undefined, a);
  const t1 = r.data.runs.find((x) => x.slot === 1);
  ok(t1 && t1.status === "finished" && t1.score === 1250, "state shows the finished score (the 'already played' screen)");

  for (const t of [a, b]) await call("POST", "/me/delete", {}, t);
  r = await call("GET", "/weekly/leaderboard");
  ok(!r.data.scores.some((x) => x.name.endsWith(tag)), "deleting profiles removes their weekly scores too");
}

const token = await profiles();
await weekly();
await endless();
await call("POST", "/me/delete", {}, token);
console.log(failures ? `\n${failures} FAILED` : "\nAll good.");
process.exit(failures ? 1 : 0);
