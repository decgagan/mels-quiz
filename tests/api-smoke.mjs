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

const token = await profiles();
await call("POST", "/me/delete", {}, token);
console.log(failures ? `\n${failures} FAILED` : "\nAll good.");
process.exit(failures ? 1 : 0);
