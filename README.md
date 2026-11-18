# Mel's Quiz

A friendly game-show style general knowledge quiz for Mel. Win as much money as you can by answering questions, and use lifelines when you're stuck. 400 multiple-choice questions with a UK flavour, played on a phone or a laptop. It works with no sign-up at all. The optional leaderboards use a simple name-and-PIN profile (no email, no tracking), and there's no build step - just plain HTML, CSS and JavaScript.

## How to play

1. Open `index.html` in a web browser (or visit the GitHub Pages address once it's switched on - see below).
2. Press **Start playing**. You start with **£0** and **3 lives** (♥♥♥).
3. Before every question, pick how hard you want it:

   | Choice | Win |
   | --- | --- |
   | Easy | £100 |
   | Medium | £250 |
   | Hard | £500 |

4. You have **30 seconds** for each question. The big number and the green bar show the time left (the bar turns amber when it's getting low).
5. Tap your answer. A right answer adds the money and takes you back to the choice screen. Questions don't repeat in a game (if a list ever runs out it is shuffled and used again).
6. A **wrong answer**, or **running out of time**, costs **one life**. When the last life goes, the game ends and you **keep everything you've won**. There is no "take the money": the game is **endless** until the lives run out.
7. **Every 10th question is a big hard one** (question 10, 20, 30 and so on). There's no choice for that one, it's always hard, and it's worth **£1,000** instead of £500.

### Lifelines

Each lifeline can be used **once per game**, and they **never refill**, however long the game goes on. It costs money, which comes out of your winnings, so a lifeline is greyed out if you can't afford it yet (you can't use any at £0).

| Lifeline | Cost | What it does |
| --- | --- | --- |
| Remove a wrong answer | £50 | Takes away one wrong option |
| Stop the clock | £50 | Freezes the timer for that question |
| Ask Dec | £50 | A short think, then Dec takes a gamble: he might confidently suggest an answer (which could be right or wrong), or knock out one or two wrong options. You can't tell from the wording whether his suggestion is right. |

When the game ends you see **You won £X!** and your **best winnings** are remembered on that device (in the browser's `localStorage`, so they never leave it).

## Changing the money, timer and lifelines

Everything is in one `CONFIG` object at the very top of `game.js`:

```js
var CONFIG = {
  currency: "£",
  startMoney: 0,
  secondsPerQuestion: 30,
  levels: [
    { key: "easy",   label: "Easy",   prize: 100, set: "easy" },
    { key: "medium", label: "Medium", prize: 250, set: "medium" },
    { key: "hard",   label: "Hard",   prize: 500, set: "hard" }
  ],
  endless: {
    lives: 3,        // a wrong answer or a timeout costs one
    bigEvery: 10,    // every 10th question is a forced hard one...
    bigPrize: 1000   // ...worth this much
  },
  lifelines: {
    removeWrong: { label: "Remove a wrong answer", cost: 50 },
    stopClock:   { label: "Stop the clock",        cost: 50 },
    phoneFriend: { label: "Ask Dec",               cost: 50 }
  },
  askDec: {
    thinkMs: 3000,
    odds: { suggestRight: 0.50, knockOut: 0.30, suggestWrong: 0.20 },
    thinkingLine: "Asking Dec...",
    suggestLine: "Dec says: I'm pretty sure it's {letter}!",
    knockOutLine: "Dec isn't sure, but it's definitely not these.",
    knockOutLineOne: "Dec isn't sure, but it's definitely not this."
  },
  storageKey: "melsQuiz.bestEndless",
  leaderboardUrl: "",   // the shared leaderboard; empty = switched off and hidden
  maxNameLength: 20,
  sessionStorageKey: "melsQuiz.session",  // remembers who is signed in on this device
  weekly: {
    questions: 10,       // per topic
    loseFraction: 0.5    // a wrong answer loses this fraction of the prize (keep it at 0.5)
  }
};
```

Change a number or the wording, save, and refresh the page. The `askDec.odds` values should add up to 1. Ask Dec costs £50 rather than £40 so every score stays a multiple of £25, which the shared leaderboard still checks. **If you change the prizes, lives, `bigEvery`/`bigPrize` or lifeline costs, change the matching "game rules" numbers at the top of `leaderboard/src/endless.js` and re-deploy the Worker**, or the Worker will refuse scores it thinks are too high. (To start the on-device best-winnings record afresh, change `storageKey` to a new name.)

## Shared leaderboard (optional)

When `leaderboardUrl` in `CONFIG` is filled in, the game has shared leaderboards. They need a **profile** (see below), because every score belongs to a player:

- When a signed-in player's game ends, the score is saved automatically and the top 10 is shown with their row highlighted. If they haven't got a profile, the end screen offers to create one (or sign in) and then saves that game.
- The start screen has a **Leaderboard** button with two tabs: **Top 10** (each player's best game) and **No lifelines** (best games where no lifeline was used).
- Each row has a small badge showing the mix of questions in that game (**Mostly hard**, **Mostly easy** or **Mixed**), plus how many questions and lifelines were used.
- Each saved game records: the money won, how many easy / medium / hard questions were answered and got right, and which lifelines were used. The Worker refuses numbers that don't add up (see `leaderboard/src/endless.js`).
- If the leaderboard can't be reached, the game says so kindly and carries on working. When `leaderboardUrl` is empty (`""`), all the profile and leaderboard buttons are hidden and the game works exactly as before.
- **Old scores:** the original 10-question game's top-10 stays safely in the old `scores` table (it is not deleted or shown in the new game). The Worker still answers the old `/scores` address, so the old version of the game keeps working until the new one goes live.

The scores live in a small Cloudflare Worker with a D1 database, in the `leaderboard/` folder. See `leaderboard/README.md` for the exact steps.

## Weekly challenge

A second way to play, once the leaderboard Worker is switched on. Every week has **three topics of ten questions** (for example 80s Music, British Food and Drink, Manchester).

- Press **Weekly challenge** on the start screen. You need a profile, because each profile gets **one go at each topic each week**.
- Pick a topic. The **Ready?** screen explains the rules, then **Start (one go only)** begins it. The go is recorded **when it starts**, so refreshing the page, closing it or coming back later never gives a second try.
- The questions come in a fixed order, easy ones first, then medium. Easy is worth **£100**, medium **£250**. There's no choosing, and there are no lives.
- A **right answer** adds the prize. A **wrong answer, or running out of the 30 seconds, loses half the prize** (£50 or £125) but doesn't end the run. You can't go below **£0**.
- **Lifelines** are the same three as the main game: Remove a wrong answer, Stop the clock and Ask Dec. Each can be used **once per topic**, costs **£50** and comes out of your winnings (so none at £0). The leaderboard shows when someone used none.
- The three topics' scores **don't add together**. There is **one weekly top 10** for all three topics: every topic go is its own row, so the same player can be on it up to three times (once per topic). Each row shows the player's name, the topic, and "no lifelines" if they used none. Press **This week's top 10** on the weekly screen to see it.
- Every **Monday at midnight UK time** (Europe/London, so it follows the clocks going forward and back) the week changes: new topics and empty leaderboards. The Worker works out the week, not the player's phone, so changing the phone's clock does nothing. Old weeks' scores stay in the database but aren't shown.
- If a go was started but not finished, it still counts as played with a score of £0.

### Adding future weeks

The weekly questions are in **`weekly.js`**. It currently has four weeks (Monday 16 Nov, 23 Nov, 30 Nov and 7 Dec 2026). **If there's no entry for the current week, the weekly challenge says "no challenge this week yet", so add new weeks before they start.**

1. Open `weekly.js` and copy a whole week block (from the `"2026-12-07": {` line to its closing `},`).
2. Paste it after the last week and change the date to the new week's **Monday** (written like `"2026-12-14"`), the three topics (`id`, `title`, `emoji`, `blurb`) and the ten questions in each.
3. Each question is `{ q: "...", options: ["A", "B", "C", "D"], answer: "B", level: "easy" }`. Use `level: "easy"` (worth £100) for the first six or so and `level: "medium"` (£250) for the last few. The questions are asked in the order you write them.
4. `answer` must be written **exactly** like one of the four options. Don't reuse a question from anywhere else in `weekly.js` or `questions.js`.
5. Run `node tests/check-questions.js`. It checks every week has 3 topics with 10 questions each, 4 different options and a valid answer, that the date is a Monday, topic ids aren't reused, and nothing repeats.
6. Commit and push as usual. Nothing needs changing on the Worker, because it only knows about the date and the topic number (0, 1 or 2), not the questions.

If you ever want a different number of topics or questions, or different prizes, change `CONFIG.weekly` in `game.js` **and** the "game rules" at the top of `leaderboard/src/weekly.js`, then deploy the Worker again.

## Player profiles

When the leaderboard is switched on, players can make a **profile**: a name (1 to 20 characters, nobody else can have the same one, capital letters don't matter) and a 4-number PIN. The device remembers who is signed in, so they only do it once.

- **Create my profile** / **Sign in** are on the start screen. To play on another phone, choose **Sign in** and type the same name and PIN.
- **Switch player** signs out of this device (handy on a shared phone).
- **My profile** shows their stats (best score, games played, questions right) and a **Delete my profile** button, which removes the profile and all their scores for good.
- After 5 wrong PINs in a row the profile is locked for 15 minutes.
- What's kept on the server: the name, the PIN (only as a salted hash, never the PIN itself), scores and stats. No email address, no IP address. This is written on the sign-up screen too.
- Playing without a profile still works. You just can't use the leaderboards.

The profile code is in `leaderboard/src/profiles.js`, with the tables in `leaderboard/migrations/0002_profiles.sql`. A profile's stats are: best endless score, games played (endless games) and questions right (endless and weekly together).

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page |
| `style.css` | Colours and big, readable layout |
| `game.js` | The game itself, with the `CONFIG` at the top |
| `questions.js` | All the questions for the main game - **this is the one to edit** |
| `weekly.js` | The weekly challenge questions, one block per week (see "Adding future weeks") |
| `tests/check-questions.js` | Checks `questions.js` and `weekly.js` are tidy (needs Node.js) |
| `tests/check-worker.mjs` | Checks the Worker's rules (no server needed) |
| `tests/api-smoke.mjs` | Tries the Worker end to end against a local copy (see `leaderboard/README.md`) |
| `leaderboard/` | The optional shared leaderboard (Cloudflare Worker + D1 database) |

## How to add questions

`questions.js` has three separate sets: `easy` (200 questions), `medium` (100) and `hard` (100). The set a question is in decides which button it appears under. Copy any line inside the set you want, for example:

```js
{ q: "What is the capital city of France?", options: ["Paris", "Lyon", "Marseille", "Nice"], answer: "Paris" },
```

Then change the question, the four options and the answer. Rules:

- Exactly **4 options**, all different.
- `answer` must be written **exactly** the same as one of the options (same capital letters and spelling).
- Keep the comma at the end of the line, and keep the lines inside the `[ ... ]` brackets.
- Don't use the same question in two sets.
- If the text contains a double quote `"`, write it as `\"` (single quotes `'` are fine).

The game shuffles the options every time, so it doesn't matter which position the answer is in. New questions are picked up automatically.

To check you haven't made a typo, run this in the project folder (needs [Node.js](https://nodejs.org)):

```
node tests/check-questions.js
```

It checks each set has the right number of questions, that every question has 4 different options and a valid answer, and that no question appears twice (even across sets and in `weekly.js`). If you add questions to `questions.js`, update the `EXPECTED` numbers at the top of that file.

## Trying it on your computer

Just double-click `index.html`. If you'd rather run it from a local web server:

```
python3 -m http.server 8000
```

then go to <http://localhost:8000>.

## Putting it online with GitHub Pages

1. Create a repository on GitHub (for example `mels-quiz`) and push this folder to it.
2. In the repository, go to **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose the `main` branch and the `/ (root)` folder, then press **Save**.
5. After a minute or two, GitHub shows the address, which will look like `https://YOUR-USERNAME.github.io/mels-quiz/`.

There's nothing to build, so no extra set-up is needed. After you push changes, give GitHub a minute or two, then refresh (you may need a hard refresh, Ctrl+F5 / Cmd+Shift+R, to see the update).
