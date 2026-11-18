# Mel's Quiz

A friendly game-show style general knowledge quiz for Mel. Win as much money as you can by answering questions, and use lifelines when you're stuck. 1,050 multiple-choice questions (each with a hint) with a UK flavour, played on a phone or a laptop. It works with no sign-up at all. The optional leaderboards use a simple name-and-PIN profile (no email, no tracking), and there's no build step - just plain HTML, CSS and JavaScript.

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
| 💡 Hint | £25 | Shows a short clue in a yellow box, for example "Think of a famous London clock tower". Hints nudge you without giving the answer away. The timer keeps running. |
| 🔄 Swap the question | £50 | Throws the question away and gives a fresh one at the same level, with the timer back to full (unless the clock is stopped). The swapped-out question doesn't count as answered. |
| 🎲 Double or nothing | £25 | Use it before you answer. Get the question right and you win **double** its prize. Get it wrong (or run out of time) and **all your money goes back to £0**. In the main game you also lose a life as normal. |

Every question in `questions.js` and `weekly.js` has a `hint`. A hint must never contain the answer itself (`node tests/check-questions.js` checks).

When the game ends you see **You won £X!** and your **best winnings** are remembered on that device (in the browser's `localStorage`, so they never leave it).

### Sound and other touches

- **Sound effects are off** to begin with. The little speaker button in the top corner of the card switches them on or off, and the device remembers the choice. The sounds are made by the browser itself (there are no sound files): a cheerful jingle for a right answer, two low notes for a wrong one, a soft tick in the last five seconds, a phone ring for Ask Dec and a fanfare for the big 10th question.
- From the third right answer in a row the game counts the **streak** ("🔥 4 right in a row!"), and it says so when you pass your best winnings on that device. These are just for fun and never change the money.
- If the **Back** button (or a Back swipe on a phone) is pressed in the middle of a game, the game asks **"Leave this game?"** instead of quietly closing it. The clock keeps running while it asks. Anywhere else, Back goes to the start screen, and from the start screen it leaves the page as usual.
- There are gentle animations (the money counts up, a lost heart pulses, confetti for a new best or a big question answered right). Anyone whose phone or computer is set to **reduce motion** gets none of them.
- On a laptop the four answers sit two by two, so the question, the answers and all six lifelines fit on the screen. On a phone they sit one under another.

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
    removeWrong: { label: "Remove a wrong answer", cost: 50, icon: "✂️" },
    stopClock:   { label: "Stop the clock",        cost: 50, icon: "⏱️" },
    phoneFriend: { label: "Ask Dec",               cost: 50, icon: "📞" },
    hint:        { label: "Hint",                  cost: 25, icon: "💡" },
    swap:        { label: "Swap the question",     cost: 50, icon: "🔄" },
    double:      { label: "Double or nothing",     cost: 25, icon: "🎲" }
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

Change a number or the wording, save, and refresh the page. The `askDec.odds` values should add up to 1. Every lifeline cost must be a multiple of £25 (Ask Dec is £50 rather than £40 for that reason) so every score stays a multiple of £25, which the shared leaderboard still checks. **If you change the prizes, lives, `bigEvery`/`bigPrize` or lifeline costs, change the matching "game rules" numbers at the top of `leaderboard/src/endless.js` and re-deploy the Worker**, or the Worker will refuse scores it thinks are too high. (To start the on-device best-winnings record afresh, change `storageKey` to a new name.)

## Shared leaderboard (optional)

When `leaderboardUrl` in `CONFIG` is filled in, the game has shared leaderboards. They need a **profile** (see below), because every score belongs to a player:

- When a signed-in player's game ends, the score is saved automatically and the end screen shows the top 10, plus the player's own rows if they're further down, all highlighted. **See all the leaderboards** shows the full top 25. If they haven't got a profile, the end screen offers to create one (or sign in) and then saves that game.
- The start screen has a **Leaderboard** button with two tabs: **Top 25** and **No lifelines**. The Top 25 is the 25 best games, and **each player can be on it up to three times, with their best three games**. The No lifelines tab works the same way, using each player's best three games where they used no lifeline. When a game is saved, the end screen says where *that game* landed, or that it wasn't one of the player's best three. All of a player's rows are highlighted, so they're easy to spot.
- Each row has a second line with the full breakdown of that game, for example **12 easy · 5 medium · 3 hard · 2 big** ("big" are the every-10th-question ones, counted separately from the other hard questions), and a third line showing which lifelines were used as little icons (✂️ Remove a wrong answer, ⏱️ Stop the clock, 📞 Ask Dec, 💡 Hint, 🔄 Swap the question, 🎲 Double or nothing) or **No lifelines**. Rows from before the big questions were tracked show them from the question count.
- Each saved game records: the money won, how many easy / medium / hard questions were answered and got right, how many of the big 10th questions were right, and which lifelines were used. The Worker refuses numbers that don't add up (see `leaderboard/src/endless.js`).
- If the leaderboard can't be reached, the game says so kindly and carries on working. When `leaderboardUrl` is empty (`""`), all the profile and leaderboard buttons are hidden and the game works exactly as before.
- **Old scores:** the original 10-question game's top-10 stays safely in the old `scores` table (it is not deleted or shown in the new game). The Worker still answers the old `/scores` address, so the old version of the game keeps working until the new one goes live.

The scores live in a small Cloudflare Worker with a D1 database, in the `leaderboard/` folder. See `leaderboard/README.md` for the exact steps.

## Weekly challenge

A second way to play, once the leaderboard Worker is switched on. Every week has **three topics of ten questions** (for example 80s Music, British Food and Drink, Manchester).

- Press **Weekly challenge** on the start screen. You need a profile, because each profile gets **one go at each topic each week**.
- Pick a topic. The **Ready?** screen explains the rules, then **Start (one go only)** begins it. The go is recorded **when it starts**, so refreshing the page, closing it or coming back later never gives a second try.
- The questions come in a fixed order, easy ones first, then medium. Easy is worth **£100**, medium **£250**. There's no choosing, and there are no lives.
- A **right answer** adds the prize. A **wrong answer, or running out of the 30 seconds, loses half the prize** (£50 or £125) but doesn't end the run. You can't go below **£0**.
- **Lifelines** are the same six as the main game. Each can be used **once per topic**, costs **£25** (Hint, Double or nothing) or **£50** (the others), and comes out of your winnings (so none at £0). **Swap the question** uses one of the topic's two spare questions (`spares` in `weekly.js`), at the same level. With **Double or nothing**, a right answer wins double, and a wrong one sends your money back to £0 instead of losing half the prize. The leaderboard shows when someone used none.
- The three topics' scores **don't add together**. There is **one weekly top 10** for all three topics: every topic go is its own row, so the same player can be on it up to three times (once per topic). Each row shows the player's name, the topic, how many were right and wrong (for example **8/10 right · 2 wrong**), and the lifelines used as icons (or **No lifelines**). Press **This week's top 10** on the weekly screen to see it.
- Every **Monday at midnight UK time** (Europe/London, so it follows the clocks going forward and back) the week changes: new topics and empty leaderboards. The Worker works out the week, not the player's phone, so changing the phone's clock does nothing. Old weeks' scores stay in the database but aren't shown.
- If a go was started but not finished, it still counts as played with a score of £0.

### Adding future weeks

The weekly questions are in **`weekly.js`**. It currently has eight weeks, from Monday 16 November 2026 to Monday 4 January 2027 (that last week ends on Sunday 10 January 2027). **If there's no entry for the current week, the weekly challenge says "no challenge this week yet", so add new weeks before they start.**

1. Open `weekly.js` and copy a whole week block (from the `"2027-01-04": {` line to its closing `},`).
2. Paste it after the last week and change the date to the new week's **Monday** (written like `"2027-01-11"`), the three topics (`id`, `title`, `emoji`, `blurb`) and the ten questions in each.
3. Each question is `{ q: "...", options: ["A", "B", "C", "D"], answer: "B", hint: "A short clue", level: "easy" }`. The `hint` is shown by the Hint lifeline: it should nudge without giving the answer away, and must not contain the answer. Use `level: "easy"` (worth £100) for the first six or so and `level: "medium"` (£250) for the last few. The questions are asked in the order you write them.
4. Each topic also has `spares`: exactly **two** extra questions (one `easy`, one `medium`), written the same way. They're only used by the **Swap the question** lifeline.
5. `answer` must be written **exactly** like one of the four options. Don't reuse a question from anywhere else in `weekly.js` or `questions.js`.
6. Run `node tests/check-questions.js`. It checks every week has 3 topics with 10 questions and 2 spares each, a hint on every question, 4 different options and a valid answer, that the date is a Monday, topic ids aren't reused, and nothing repeats.
7. Commit and push as usual. Nothing needs changing on the Worker, because it only knows about the date and the topic number (0, 1 or 2), not the questions.

If you ever want a different number of topics or questions, or different prizes, change `CONFIG.weekly` in `game.js` **and** the "game rules" at the top of `leaderboard/src/weekly.js`, then deploy the Worker again.

## Player profiles

When the leaderboard is switched on, players can make a **profile**: a name (1 to 20 characters, nobody else can have the same one, capital letters don't matter) and a 4-number PIN. The device remembers who is signed in, so they only do it once.

- **Create my profile** / **Sign in** are on the start screen. To play on another phone, choose **Sign in** and type the same name and PIN.
- **Switch player** signs out of this device (handy on a shared phone).
- **My profile** is a full stats page and has a **Delete my profile** button, which removes the profile and all their scores for good. The stats are: questions answered, questions right, accuracy, total money earned (endless and weekly), member since; for the endless game the best score, average score, games played and longest run (in questions); questions answered and right for easy, medium and hard, and for the big 10th questions; how many times each of the six lifelines was used; and for the weekly challenge the runs played, best score and total winnings. If there's nothing to work out yet (no games, say) it shows a dash.
- After 5 wrong PINs in a row the profile is locked for 15 minutes.
- What's kept on the server: the name, the PIN (only as a salted hash, never the PIN itself), scores and stats. No email address, no IP address. This is written on the sign-up screen too.
- Playing without a profile still works. You just can't use the leaderboards.

The profile code is in `leaderboard/src/profiles.js`, with the tables in `leaderboard/migrations/0002_profiles.sql`. The stats page is worked out by the Worker from the saved games (`leaderboard/src/stats.js`, `GET /me/stats`), so it always matches the leaderboards. Games saved before migration `0005` don't have the big-question or weekly easy/medium detail, so they count in the totals but are left out of those particular lines.

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

`questions.js` has three separate sets: `easy` (450 questions), `medium` (300) and `hard` (300). The set a question is in decides which button it appears under. Copy any line inside the set you want, for example:

```js
{ q: "What is the capital city of France?", options: ["Paris", "Lyon", "Marseille", "Nice"], answer: "Paris", hint: "It's home to the Eiffel Tower." },
```

Then change the question, the four options, the answer and the hint. Rules:

- Exactly **4 options**, all different.
- `answer` must be written **exactly** the same as one of the options (same capital letters and spelling).
- Every question needs a `hint` (shown by the Hint lifeline). It should nudge, not give the answer away, so don't put the answer's words in it.
- Keep the comma at the end of the line, and keep the lines inside the `[ ... ]` brackets.
- Don't use the same question in two sets.
- If the text contains a double quote `"`, write it as `\"` (single quotes `'` are fine).

The game shuffles the options every time, so it doesn't matter which position the answer is in. New questions are picked up automatically.

To check you haven't made a typo, run this in the project folder (needs [Node.js](https://nodejs.org)):

```
node tests/check-questions.js
```

It checks each set has the right number of questions, that every question has 4 different options, a valid answer and a hint that doesn't contain the answer, that each weekly topic has its two spare questions, and that no question appears twice (even across sets and in `weekly.js`). If you add questions to `questions.js`, update the `EXPECTED` numbers at the top of that file.

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
