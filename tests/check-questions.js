// Run with:  node tests/check-questions.js
// Checks that questions.js is well formed.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "..", "questions.js"), "utf8");
const QUESTIONS = vm.runInNewContext(src + "\n;QUESTIONS");

// How many questions each set should have. Change these numbers if you add questions.
const EXPECTED = { easy: 200, medium: 100, hard: 100 };

const errors = [];
const seen = new Map(); // question text -> "set #n"

Object.keys(EXPECTED).forEach((set) => {
  const list = QUESTIONS[set];
  if (!Array.isArray(list)) { errors.push(`Missing set: ${set}`); return; }
  if (list.length !== EXPECTED[set]) errors.push(`${set}: expected ${EXPECTED[set]} questions, found ${list.length}`);

  list.forEach((item, i) => {
    const n = `${set} #${i + 1} (${item && item.q})`;
    if (typeof item.q !== "string" || !item.q.trim()) errors.push(`${n}: missing question text`);
    if (!Array.isArray(item.options) || item.options.length !== 4) { errors.push(`${n}: needs exactly 4 options`); return; }
    if (item.options.some((o) => typeof o !== "string" || !o.trim())) errors.push(`${n}: empty/non-text option`);
    if (new Set(item.options.map((o) => o.trim().toLowerCase())).size !== 4) errors.push(`${n}: options are not unique`);
    const matches = item.options.filter((o) => o === item.answer).length;
    if (matches !== 1) errors.push(`${n}: answer must match exactly one option (matches: ${matches})`);
    const key = String(item.q).trim().toLowerCase();
    if (seen.has(key)) errors.push(`${n}: duplicate of ${seen.get(key)}`);
    else seen.set(key, `${set} #${i + 1}`);
  });
});

Object.keys(QUESTIONS).forEach((set) => {
  if (!(set in EXPECTED)) errors.push(`Unexpected set "${set}" - add it to EXPECTED in this test if it's intended`);
});

if (errors.length) {
  console.error("FAIL\n" + errors.join("\n"));
  process.exit(1);
}

const total = Object.values(QUESTIONS).reduce((a, l) => a + l.length, 0);
console.log(`OK: ${total} questions (` + Object.keys(EXPECTED).map((s) => `${s} ${QUESTIONS[s].length}`).join(", ") + ").");
console.log("Every question has 4 unique options and a valid answer, and no question appears twice (within or across sets).");
Object.keys(EXPECTED).forEach((set) => {
  const pos = [0, 0, 0, 0];
  QUESTIONS[set].forEach((q) => pos[q.options.indexOf(q.answer)]++);
  console.log(`  ${set}: correct answer in file position 1-4 = ${pos.join(", ")}`);
});
