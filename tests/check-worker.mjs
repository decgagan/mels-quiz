// Run with:  node tests/check-worker.mjs
// Checks the Worker's rules without needing a server or a database.
import { validateRun, PRIZES, BIG_PRIZE } from "../leaderboard/src/endless.js";
import { cleanName } from "../leaderboard/src/profiles.js";

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

console.log(failures ? `\n${failures} FAILED` : "\nAll good.");
process.exit(failures ? 1 : 0);
