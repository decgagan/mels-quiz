// Talks to a RUNNING Worker and checks the main flows. Needs a local Worker:
//   cd leaderboard
//   npx wrangler d1 migrations apply mels-quiz-scores --local
//   npx wrangler dev --var CREATE_SECONDS:0 RATE_LIMIT_SECONDS:0
// then, in another window:   node tests/api-smoke.mjs   (or: node tests/api-smoke.mjs http://localhost:8787)
// It makes up throwaway players with random names, so it is safe to run more than once.

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

const token = await profiles();
await endless();
await call("POST", "/me/delete", {}, token);
console.log(failures ? `\n${failures} FAILED` : "\nAll good.");
process.exit(failures ? 1 : 0);
