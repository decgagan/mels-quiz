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
  // a player's second, worse run is a second entry (each player can hold their best 3)
  await call("POST", "/runs", run({ score: 50 }), a);
  r = await call("GET", "/leaderboard/endless?board=overall");
  ok(r.data.scores.filter((x) => x.name.startsWith("Ann " + tag)).map((x) => x.score).join() === "4100,50", "a second, worse run adds a second row for the player (up to 3), below their best");
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

async function topThree() {
  console.log("Endless board: top 25, each player's best 3 runs");
  const mk = async (n) => (await call("POST", "/profiles", { name: n + " " + tag, pin: "1111" })).data.token;
  const mine = (r, who) => r.data.scores.filter((x) => x.name === who + " " + tag);
  const p = await mk("Pia"), q = await mk("Quin");
  const created = [p, q];

  let r = await call("POST", "/runs", run({ score: 3500 }), q);
  ok(r.status === 201 && r.data.rank === 1, "Quin saves 3500 (place 1)");
  r = await call("POST", "/runs", run({ score: 4000 }), p);
  ok(r.data.rank === 1 && r.data.rankNoLifelines === 1, "Pia's 4000 is place 1, overall and with no lifelines");
  r = await call("POST", "/runs", run({ score: 3000 }), p);
  ok(r.data.rank === 3, "Pia's 3000 is place 3 (her own 4000 counts as an entry above it)");
  r = await call("POST", "/runs", run({ score: 2000 }), p);
  ok(r.data.rank === 4 && r.data.scores.filter((x) => x.name === "Pia " + tag).length === 3, "her 3rd run is place 4 and she now has 3 rows");
  r = await call("POST", "/runs", run({ score: 1000 }), p);
  ok(r.status === 201 && r.data.saved === true && r.data.rank === null && r.data.rankNoLifelines === null, "a 4th run that isn't in her best 3 saves but has no place on the board");
  ok(r.data.profile.gamesPlayed === 4, "...and still counts as a game played");

  r = await call("GET", "/leaderboard/endless?board=overall", undefined, p);
  let rows = r.data.scores.filter((x) => x.name.endsWith(tag));
  ok(mine(r, "Pia").length === 3, "a player with 4 runs appears exactly 3 times");
  ok(rows.map((x) => x.name.split(" ")[0] + x.score).join() === "Pia4000,Quin3500,Pia3000,Pia2000", "ordered by score across players: Pia 4000, Quin 3500, Pia 3000, Pia 2000 (her 1000 is left out)");
  ok(rows.filter((x) => x.me).length === 3 && rows.every((x) => x.me === x.name.startsWith("Pia")), "'me' is true on all three of Pia's rows and no one else's");
  r = await call("GET", "/leaderboard/endless?board=overall", undefined, q);
  ok(r.data.scores.filter((x) => x.me).length === 1, "for Quin only one row is 'me'");

  // a new run that beats one of her three pushes the lowest out
  r = await call("POST", "/runs", run({ score: 2500 }), p);
  ok(r.data.rank === 4, "Pia's new 2500 lands at place 4");
  r = await call("GET", "/leaderboard/endless?board=overall");
  ok(mine(r, "Pia").map((x) => x.score).join() === "4000,3000,2500", "her best three are now 4000, 3000, 2500 (the 2000 dropped off)");

  // no-lifelines board = best 3 runs with no lifeline; overall board = best 3 of everything
  const rr = await mk("Rae"); created.push(rr);
  for (const sc of [3900, 3800, 3700]) await call("POST", "/runs", run({ score: sc, lifelines: ["phoneFriend"] }), rr);
  r = await call("POST", "/runs", run({ score: 500 }), rr);
  ok(r.data.rank === null && r.data.rankNoLifelines !== null, "Rae's 500 isn't in her best 3 overall, but is on the no-lifelines board");
  for (const sc of [400, 300, 200]) r = await call("POST", "/runs", run({ score: sc }), rr);
  ok(r.data.rank === null && r.data.rankNoLifelines === null, "her 4th no-lifeline run (200) is on neither board");
  r = await call("GET", "/leaderboard/endless?board=overall");
  ok(mine(r, "Rae").map((x) => x.score).join() === "3900,3800,3700" && mine(r, "Rae").every((x) => x.lifelines.length === 1), "overall: Rae's best three (all with a lifeline)");
  r = await call("GET", "/leaderboard/endless?board=nolifelines");
  ok(mine(r, "Rae").map((x) => x.score).join() === "500,400,300" && mine(r, "Rae").every((x) => x.lifelines.length === 0), "no-lifelines: her best three with none");
  ok(mine(r, "Pia").length === 3, "no-lifelines: Pia has her three too");

  // the board holds 25 entries at most
  for (let i = 0; i < 10; i++) {
    const t = await mk("Fill" + i); created.push(t);
    for (let j = 0; j < 3; j++) await call("POST", "/runs", run({ score: 100 + 25 * (i * 3 + j) + 25 }), t);
  }
  for (const board of ["overall", "nolifelines"]) {
    r = await call("GET", "/leaderboard/endless?board=" + board);
    const sc = r.data.scores.map((x) => x.score);
    ok(sc.length === 25, board + " board is capped at 25 entries (" + sc.length + ")");
    ok(sc.every((v, i) => i === 0 || sc[i - 1] >= v), board + " board is in score order");
    const counts = {};
    for (const x of r.data.scores) counts[x.name] = (counts[x.name] || 0) + 1;
    ok(Object.values(counts).every((n) => n <= 3), board + " board: nobody appears more than 3 times");
  }
  r = await call("GET", "/leaderboard/endless?board=overall", undefined, p);
  ok(r.data.scores.filter((x) => x.me).length === mine(r, "Pia").length && mine(r, "Pia").length === 3, "'me' still marks all of Pia's rows on a full board");

  for (const t of created) await call("POST", "/me/delete", {}, t);
  r = await call("GET", "/leaderboard/endless?board=overall");
  ok(!r.data.scores.some((x) => x.name.endsWith(tag)), "deleting the profiles removes all their entries");
}

async function stats() {
  console.log("Profile stats and the richer leaderboard rows");
  const mk = async (n) => (await call("POST", "/profiles", { name: n + " " + tag, pin: "1111" })).data.token;
  const s = await mk("Stat"), e = await mk("Empty");

  let r = await call("GET", "/me/stats");
  ok(r.status === 401, "stats need a sign-in");
  r = await call("GET", "/me/stats", undefined, e);
  const z = r.data.stats;
  ok(r.status === 200 && z.questions.answered === 0 && z.questions.accuracy === null && z.money.total === 0, "brand new profile: zeros, no accuracy yet");
  ok(z.endless.games === 0 && z.endless.best === null && z.endless.average === null && z.endless.longestRun === null && z.weekly.runs === 0 && z.weekly.best === null, "...and nothing made up for best / average / longest / weekly best");
  ok(typeof z.memberSince === "string" && !isNaN(Date.parse(z.memberSince)), "member-since date is there");

  // two endless runs (the first with the big question tracked), two weekly runs (one from an "older page", with no levels)
  r = await call("POST", "/runs", run({ score: 4100, bigCorrect: 1 }), s);
  ok(r.status === 201, "endless run with bigCorrect saves");
  r = await call("POST", "/runs", run({ score: 3600, bigCorrect: 0 }), s);
  ok(r.status === 201, "a run where the big one was wrong saves at the lower maximum (£3,600)");
  r = await call("POST", "/runs", run({ score: 4100, bigCorrect: 0 }), s);
  ok(r.status === 400, "...and not at £4,100");
  r = await call("POST", "/runs", run({ score: 350, answered: { easy: 4, medium: 0, hard: 3 }, correct: { easy: 4, medium: 0, hard: 0 }, bigCorrect: 0, lifelines: ["phoneFriend"] }), s);
  ok(r.status === 201, "a short run with a lifeline saves");
  await call("POST", "/weekly/start", { slot: 0 }, s);
  await call("POST", "/weekly/start", { slot: 1 }, s);
  await new Promise((res) => setTimeout(res, 3300));
  const lv = { easy: { answered: 6, correct: 5 }, medium: { answered: 4, correct: 2 } };
  r = await call("POST", "/weekly/finish", { slot: 0, score: 900, correct: 7, wrong: 3, lifelines: ["stopClock"], levels: lv }, s);
  ok(r.status === 200, "weekly run with levels saves (5 easy + 2 medium = £1,000, minus £50 for the lifeline = £950, so £900 is fine)");
  r = await call("POST", "/weekly/finish", { slot: 1, score: 500, correct: 4, wrong: 6, lifelines: [] }, s);
  ok(r.status === 200, "weekly run from an older page (no levels) still saves");

  r = await call("GET", "/me/stats", undefined, s);
  const t = r.data.stats;
  // endless: answered easy 2+2+4=8, medium 3+3+0=6, hard 7+7+3=17; correct easy 1+1+4=6, medium 2+2=4, hard 6+6+0=12
  ok(t.endless.games === 3 && t.endless.best === 4100 && t.endless.average === Math.round((4100 + 3600 + 350) / 3) && t.endless.longestRun === 12, "endless: games, best, average and longest run");
  ok(t.endless.questions === 31 && t.endless.correct === 22, "endless questions answered 31, right 22");
  ok(t.questions.answered === 31 + 20 && t.questions.correct === 22 + 11, "all questions = endless + weekly (the older weekly run still counts in the totals)");
  ok(t.questions.accuracy === Math.round(33 / 51 * 100), "accuracy " + t.questions.accuracy + "%");
  ok(t.money.endless === 8050 && t.money.weekly === 1400 && t.money.total === 9450, "money: endless + weekly = total");
  ok(t.weekly.runs === 2 && t.weekly.best === 900 && t.weekly.winnings === 1400 && t.weekly.correct === 11 && t.weekly.wrong === 9, "weekly: runs, best, winnings, right and wrong");
  ok(t.byLevel.easy.answered === 8 + 6 && t.byLevel.easy.correct === 6 + 5, "easy answered / right (the older weekly run isn't split by level, so isn't in here)");
  ok(t.byLevel.medium.answered === 6 + 4 && t.byLevel.medium.correct === 4 + 2, "medium answered / right");
  ok(t.byLevel.hard.answered === 17 && t.byLevel.hard.correct === 12, "hard answered / right");
  ok(t.big.answered === 2 && t.big.correct === 1, "big 10th questions: 2 answered, 1 right (the 12-question runs; the short one had none)");
  ok(t.lifelines.phoneFriend === 1 && t.lifelines.stopClock === 1 && t.lifelines.removeWrong === 0 && t.lifelines.total === 2, "lifelines used, per type");
  r = await call("GET", "/me", undefined, s);
  ok(r.data.profile.totalCorrect === t.questions.correct && r.data.profile.gamesPlayed === 3, "the old profile counters agree with the stats");

  // richer leaderboard rows
  r = await call("GET", "/leaderboard/endless?board=overall");
  const row = r.data.scores.find((x) => x.name === "Stat " + tag);
  ok(row && row.answered.easy === 2 && row.answered.medium === 3 && row.answered.hard === 7 && row.big === 1, "endless row: answered by level and how many were big (best run)");
  ok(row.lifelines.length === 0, "...with its lifelines list");
  r = await call("GET", "/weekly/leaderboard");
  const wr = r.data.scores.filter((x) => x.name === "Stat " + tag);
  ok(wr.length === 2 && wr[0].correct === 7 && wr[0].wrong === 3 && wr[0].lifelines.join() === "stopClock" && wr[0].noLifelines === false, "weekly row: right, wrong and lifelines used");
  ok(wr[1].correct === 4 && wr[1].wrong === 6 && wr[1].lifelines.length === 0 && wr[1].noLifelines === true, "...and a run with no lifelines");

  // deleting the profile deletes the stats with it
  await call("POST", "/me/delete", {}, s);
  await call("POST", "/me/delete", {}, e);
  r = await call("GET", "/me/stats", undefined, s);
  ok(r.status === 401, "after deleting, the profile has no stats");
}

async function newLifelines() {
  console.log("New lifelines: Hint, Swap the question, Double or nothing");
  const n = await call("POST", "/profiles", { name: "Neo " + tag, pin: "1111" });
  const t = n.data.token;
  // The usual 12-question run can win at most £4,100. Double or nothing can add one more £1,000 (the big question),
  // and Hint + Swap + Double cost £25 + £50 + £25, so the most is £5,000.
  let r = await call("POST", "/runs", run({ score: 5025, bigCorrect: 1, lifelines: ["double", "hint", "swap"] }), t);
  ok(r.status === 400, "one step over the Double or nothing limit is refused");
  r = await call("POST", "/runs", run({ score: 5000, bigCorrect: 1, lifelines: ["double", "hint", "swap"] }), t);
  ok(r.status === 201, "a run with a doubled big question saves at £5,000");
  r = await call("POST", "/runs", run({ score: 0, bigCorrect: 1, lifelines: ["double"] }), t);
  ok(r.status === 201, "a run where Double or nothing went wrong (bank back to £0) saves");
  r = await call("GET", "/leaderboard/endless?board=overall");
  const row = r.data.scores.find((x) => x.name === "Neo " + tag && x.score === 5000);
  ok(row && row.lifelines.join() === "hint,swap,double", "the leaderboard row lists the new lifelines in order");
  await call("POST", "/weekly/start", { slot: 2 }, t);
  await new Promise((res) => setTimeout(res, 3300));
  r = await call("POST", "/weekly/finish", { slot: 2, score: 1750, correct: 6, wrong: 4, lifelines: ["double"] }, t);
  ok(r.status === 400, "weekly: 6 right with Double can't be £1,750 (most is 6 x £250 + £250 - £25)");
  r = await call("POST", "/weekly/finish", { slot: 2, score: 1725, correct: 6, wrong: 4, lifelines: ["double"] }, t);
  ok(r.status === 200, "...but £1,725 saves");
  r = await call("GET", "/me/stats", undefined, t);
  const ll = r.data.stats.lifelines;
  ok(ll.hint === 1 && ll.swap === 1 && ll.double === 3 && ll.removeWrong === 0 && ll.total === 5, "profile stats count each new lifeline");
  await call("POST", "/me/delete", {}, t);
}

const token = await profiles();
await weekly();
await endless();
await topThree();
await stats();
await newLifelines();
await call("POST", "/me/delete", {}, token);
console.log(failures ? `\n${failures} FAILED` : "\nAll good.");
process.exit(failures ? 1 : 0);
