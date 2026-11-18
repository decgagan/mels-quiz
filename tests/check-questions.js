// Run with:  node tests/check-questions.js
// Checks that questions.js is well formed.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "..", "questions.js"), "utf8");
const QUESTIONS = vm.runInNewContext(src + "\n;QUESTIONS");

const EXPECTED = 200;
const errors = [];
if (!Array.isArray(QUESTIONS)) errors.push("QUESTIONS is not an array");
if (QUESTIONS.length !== EXPECTED) errors.push(`Expected ${EXPECTED} questions, found ${QUESTIONS.length}`);

const seen = new Set();
QUESTIONS.forEach((item, i) => {
  const n = `#${i + 1} (${item && item.q})`;
  if (typeof item.q !== "string" || !item.q.trim()) errors.push(`${n}: missing question text`);
  if (!Array.isArray(item.options) || item.options.length !== 4) { errors.push(`${n}: needs exactly 4 options`); return; }
  if (item.options.some(o => typeof o !== "string" || !o.trim())) errors.push(`${n}: empty/non-text option`);
  if (new Set(item.options.map(o => o.trim().toLowerCase())).size !== 4) errors.push(`${n}: options are not unique`);
  const matches = item.options.filter(o => o === item.answer).length;
  if (matches !== 1) errors.push(`${n}: answer must match exactly one option (matches: ${matches})`);
  const key = item.q.trim().toLowerCase();
  if (seen.has(key)) errors.push(`${n}: duplicate question`);
  seen.add(key);
});

if (errors.length) {
  console.error("FAIL\n" + errors.join("\n"));
  process.exit(1);
}
const positions = [0, 0, 0, 0];
QUESTIONS.forEach(q => positions[q.options.indexOf(q.answer)]++);
console.log(`OK: ${QUESTIONS.length} questions, all with 4 unique options and a valid answer.`);
console.log(`Correct-answer positions in file (1st-4th): ${positions.join(", ")}`);
