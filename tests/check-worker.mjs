// Run with:  node tests/check-worker.mjs
// Checks the Worker's rules without needing a server or a database.
import { validateRun, PRIZES, BIG_PRIZE } from "../leaderboard/src/endless.js";
import { cleanName } from "../leaderboard/src/profiles.js";
import { weekInfo, validateFinish } from "../leaderboard/src/weekly.js";

let failures = 0;
function ok(cond, msg) { if (cond) console.log("  ok:", msg); else { failures++; console.log("  FAIL:", msg); } }

console.log("Names");
ok(cleanName("  Mel  ").name === "Mel", "trims");
ok(cleanName("Mel   Gagan").name === "Mel Gagan", "squashes double spaces");
ok(cleanName("MEL").key === cleanName("mel").key, "case doesn't matter for the unique key");
ok(cleanName("").error && cleanName("   ").error, "empty is refused");
ok(!cleanName("a".repeat(20)).error && cleanName("a".repeat(21)).error, "20 ok, 21 refused");
ok(!cleanName("😀".repeat(20)).error, "emoji count as one character each");
ok(cleanName("a\u0007b").error, "control characters refused");
ok(cleanName(5).error, "non-text refused");

console.log("Endless runs");
const base = () => ({ runId: "abcdefgh1234", score: 0, answered: { easy: 2, medium: 3, hard: 7 }, correct: { easy: 1, medium: 2, hard: 6 }, lifelines: [] });
const most = 1 * PRIZES.easy + 2 * PRIZES.medium + 6 * PRIZES.hard + (BIG_PRIZE - PRIZES.hard);   // one 10th question among the 12
ok(!validateRun({ ...base(), score: most }).error, `score ${most} (the most possible) is accepted`);
ok(validateRun({ ...base(), score: most + 25 }).error, "one step more is refused");
ok(validateRun({ ...base(), score: most - 10 }).error, "not a multiple of 25 is refused");
ok(!validateRun({ ...base(), score: 0 }).error, "£0 is a valid run");
ok(validateRun({ ...base(), score: -25 }).error, "negative refused");
ok(!validateRun({ ...base(), score: most - 50, lifelines: ["phoneFriend"] }).error, "a lifeline costs £50 off the maximum");
ok(validateRun({ ...base(), score: most, lifelines: ["phoneFriend"] }).error, "...so the full amount is refused with a lifeline");
ok(validateRun({ ...base(), lifelines: ["phoneFriend", "phoneFriend"] }).error, "same lifeline twice refused");
ok(validateRun({ ...base(), lifelines: ["telepathy"] }).error, "unknown lifeline refused");
ok(validateRun({ ...base(), correct: { easy: 1, medium: 2, hard: 5 } }).error, "must end on exactly 3 wrong answers (4 wrong refused)");
ok(validateRun({ ...base(), correct: { easy: 2, medium: 3, hard: 7 } }).error, "unfinished run (0 wrong) refused");
ok(validateRun({ ...base(), correct: { easy: 3, medium: 2, hard: 6 } }).error, "more right than answered refused");
ok(validateRun({ ...base(), answered: { easy: 5, medium: 5, hard: 0 }, correct: { easy: 3, medium: 4, hard: 0 } }).error, "10 questions with no hard question refused");
ok(!validateRun({ ...base(), answered: { easy: 0, medium: 0, hard: 3 }, correct: { easy: 0, medium: 0, hard: 0 } }).error, "three wrong answers straight away is a valid £0 run");
ok(validateRun({ ...base(), runId: "short" }).error, "short run id refused");
ok(validateRun({ ...base(), answered: { easy: 2.5, medium: 3, hard: 7 } }).error, "fractions refused");
ok(validateRun({ ...base(), answered: { easy: 3000, medium: 0, hard: 0 }, correct: { easy: 2997, medium: 0, hard: 0 } }).error, "more than 2000 questions refused");
ok(validateRun(null).error && validateRun([]).error, "non-objects refused");

console.log("Weeks (UK time)");
const wk = (iso) => weekInfo(Date.parse(iso));
ok(wk("2026-11-18T19:00:00Z").key === "2026-11-16", "Wednesday 18 Nov 2026 is in the week of Monday 16 Nov");
ok(wk("2026-11-16T00:00:00Z").key === "2026-11-16", "Monday 00:00 starts the new week (GMT)");
ok(wk("2026-11-15T23:59:59Z").key === "2026-11-09", "one second before is still the old week");
ok(wk("2026-11-22T23:59:59Z").key === "2026-11-16", "Sunday 23:59 is still that week");
ok(wk("2026-11-23T00:00:00Z").key === "2026-11-23", "next Monday 00:00 rolls the week over");
ok(wk("2026-11-18T19:00:00Z").endsAt === "2026-11-23T00:00:00.000Z", "the week ends at Monday 00:00 GMT");
// British Summer Time: clocks go forward on Sunday 29 March 2026 and back on Sunday 25 October 2026
ok(wk("2026-06-14T22:59:00Z").key === "2026-06-08" && wk("2026-06-14T23:00:00Z").key === "2026-06-15", "BST: the week turns over at 23:00 UTC Sunday (midnight UK)");
ok(wk("2026-06-10T12:00:00Z").endsAt === "2026-06-14T23:00:00.000Z", "BST: week ends at 23:00 UTC");
ok(wk("2026-10-25T00:30:00Z").key === "2026-10-19" && wk("2026-10-25T23:30:00Z").key === "2026-10-19", "clocks going back (Sun 25 Oct) don't confuse the week");
ok(wk("2026-10-26T00:00:00Z").key === "2026-10-26", "Monday 26 Oct 00:00 GMT starts a week");
ok(wk("2026-10-20T12:00:00Z").endsAt === "2026-10-26T00:00:00.000Z", "week ending over the clocks-back weekend is Monday 00:00 GMT");
ok(wk("2026-03-24T12:00:00Z").endsAt === "2026-03-29T23:00:00.000Z", "week with the clocks-forward Sunday ends Monday 00:00 BST (= 23:00 UTC Sunday)");
ok(wk("2026-03-29T23:30:00Z").key === "2026-03-30", "Mon 30 Mar 00:30 BST (23:30 UTC Sunday) is the new week");
ok(wk("2026-12-31T12:00:00Z").key === "2026-12-28" && wk("2027-01-03T23:59:00Z").key === "2026-12-28", "year end");

console.log("Weekly runs");
const wrun = (o = {}) => ({ slot: 0, score: 0, correct: 6, wrong: 4, lifelines: [], ...o });
ok(!validateFinish(wrun({ score: 1500 })).error, "6 right can be at most 6 x £250 = £1,500");
ok(validateFinish(wrun({ score: 1525 })).error, "one step more refused");
ok(!validateFinish(wrun({ score: 1450, lifelines: ["stopClock"] })).error, "a lifeline takes £50 off the maximum");
ok(validateFinish(wrun({ score: 1500, lifelines: ["stopClock"] })).error, "...so the full amount is refused");
ok(validateFinish(wrun({ correct: 6, wrong: 3 })).error, "must be 10 questions");
ok(validateFinish(wrun({ slot: 3 })).error && validateFinish(wrun({ slot: -1 })).error && validateFinish(wrun({ slot: "0" })).error, "slot must be 0, 1 or 2");
ok(validateFinish(wrun({ score: 30 })).error, "score must be a multiple of 25");
ok(!validateFinish(wrun({ correct: 0, wrong: 10, score: 0 })).error, "£0 with nothing right is fine");
ok(validateFinish(wrun({ correct: 0, wrong: 10, score: 25 })).error, "...but £25 with nothing right isn't");

console.log(failures ? `\n${failures} FAILED` : "\nAll good.");
process.exit(failures ? 1 : 0);
