// Run with:  node tests/check-questions.js
// Checks that questions.js and weekly.js are well formed.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "..", "questions.js"), "utf8");
const QUESTIONS = vm.runInNewContext(src + "\n;QUESTIONS");
const weeklySrc = fs.readFileSync(path.join(__dirname, "..", "weekly.js"), "utf8");
const WEEKLY = vm.runInNewContext(weeklySrc + "\n;WEEKLY");

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

// ---- weekly.js: 3 topics a week, 10 questions each ----
const TOPICS_PER_WEEK = 3, QUESTIONS_PER_TOPIC = 10, LEVELS = ["easy", "medium"];
const topicIds = new Set();
let weeklyCount = 0;
const weekKeys = Object.keys(WEEKLY).sort();
if (!weekKeys.length) errors.push("weekly.js has no weeks");
weekKeys.forEach((week) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) { errors.push(`weekly ${week}: the week must be written as a date like 2026-11-16`); return; }
  if (new Date(week + "T12:00:00Z").getUTCDay() !== 1) errors.push(`weekly ${week}: that date is not a Monday`);
  const topics = WEEKLY[week] && WEEKLY[week].topics;
  if (!Array.isArray(topics) || topics.length !== TOPICS_PER_WEEK) { errors.push(`weekly ${week}: needs exactly ${TOPICS_PER_WEEK} topics`); return; }
  topics.forEach((t, ti) => {
    const tn = `weekly ${week} topic ${ti + 1} (${t && t.title})`;
    if (!t || typeof t.id !== "string" || !/^[a-z0-9-]+$/.test(t.id)) errors.push(`${tn}: id must be lower-case letters, numbers and dashes`);
    else if (topicIds.has(t.id)) errors.push(`${tn}: the id "${t.id}" is used twice`);
    else topicIds.add(t.id);
    ["title", "emoji", "blurb"].forEach((f) => { if (typeof t[f] !== "string" || !t[f].trim()) errors.push(`${tn}: missing ${f}`); });
    if (!Array.isArray(t.questions) || t.questions.length !== QUESTIONS_PER_TOPIC) { errors.push(`${tn}: needs exactly ${QUESTIONS_PER_TOPIC} questions`); return; }
    t.questions.forEach((item, i) => {
      weeklyCount++;
      const n = `${tn} #${i + 1} (${item && item.q})`;
      if (typeof item.q !== "string" || !item.q.trim()) errors.push(`${n}: missing question text`);
      if (!LEVELS.includes(item.level)) errors.push(`${n}: level must be "easy" or "medium"`);
      if (!Array.isArray(item.options) || item.options.length !== 4) { errors.push(`${n}: needs exactly 4 options`); return; }
      if (item.options.some((o) => typeof o !== "string" || !o.trim())) errors.push(`${n}: empty/non-text option`);
      if (new Set(item.options.map((o) => o.trim().toLowerCase())).size !== 4) errors.push(`${n}: options are not unique`);
      const matches = item.options.filter((o) => o === item.answer).length;
      if (matches !== 1) errors.push(`${n}: answer must match exactly one option (matches: ${matches})`);
      const key = String(item.q).trim().toLowerCase();
      if (seen.has(key)) errors.push(`${n}: duplicate of ${seen.get(key)}`);
      else seen.set(key, `weekly ${week} topic ${ti + 1} #${i + 1}`);
    });
  });
});

if (errors.length) {
  console.error("FAIL\n" + errors.join("\n"));
  process.exit(1);
}

console.log(`OK: weekly.js has ${weekKeys.length} weeks (${weekKeys[0]} to ${weekKeys[weekKeys.length - 1]}), ${weekKeys.length * TOPICS_PER_WEEK} topics, ${weeklyCount} questions. Each topic has 10 questions with 4 unique options and a valid answer, with no repeats anywhere (including questions.js).`);
const total = Object.values(QUESTIONS).reduce((a, l) => a + l.length, 0);
console.log(`OK: ${total} questions (` + Object.keys(EXPECTED).map((s) => `${s} ${QUESTIONS[s].length}`).join(", ") + ").");
console.log("Every question has 4 unique options and a valid answer, and no question appears twice (within or across sets).");
Object.keys(EXPECTED).forEach((set) => {
  const pos = [0, 0, 0, 0];
  QUESTIONS[set].forEach((q) => pos[q.options.indexOf(q.answer)]++);
  console.log(`  ${set}: correct answer in file position 1-4 = ${pos.join(", ")}`);
});
