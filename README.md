# Mel's Quiz

A friendly game-show style general knowledge quiz for Mel. Win as much money as you can by answering questions, and use lifelines when you're stuck. 400 multiple-choice questions with a UK flavour, played on her own, on a phone or a laptop. No sign-ups, no tracking (the optional leaderboard only stores the name and score a player chooses to add), no build step - just plain HTML, CSS and JavaScript.

## How to play

1. Open `index.html` in a web browser (or visit the GitHub Pages address once it's switched on - see below).
2. Press **Start playing**. You start with **£0**.
3. Before every question, including the first, pick how hard you want it:

   | Choice | Win |
   | --- | --- |
   | Easy | £100 |
   | Medium | £250 |
   | Hard | £500 |

4. You have **30 seconds** for each question. The big number and the green bar show the time left (the bar turns amber when it's getting low).
5. Tap your answer. A right answer adds the money and takes you back to the choice screen. Questions never repeat within a game.
6. A **wrong answer**, or **running out of time**, ends the game, but you **keep everything you've won**. You can also press **Take the money and stop** on the choice screen to finish early.
7. A game is a maximum of **10 questions**, then it ends.

### Lifelines

Each lifeline can be used **once per game**. It costs money, which comes out of your winnings, so a lifeline is greyed out if you can't afford it yet (you can't use any at £0).

| Lifeline | Cost | What it does |
| --- | --- | --- |
| Remove a wrong answer | £50 | Takes away one wrong option |
| Stop the clock | £50 | Freezes the timer for that question |
| Ask Dec | £75 | Pauses the timer and says "Ask Dec! Take your time." Ring (or message) Dec, then press **Back to the question** to carry on. The game does nothing else - it's just for asking a real person. |

When the game ends you see **You won £X!** and your **best winnings** are remembered on that device (in the browser's `localStorage`, so they never leave it).

## Changing the money, timer and lifelines

Everything is in one `CONFIG` object at the very top of `game.js`:

```js
var CONFIG = {
  currency: "£",
  startMoney: 0,
  maxQuestions: 10,
  secondsPerQuestion: 30,
  levels: [
    { key: "easy",   label: "Easy",   prize: 100, set: "easy" },
    { key: "medium", label: "Medium", prize: 250, set: "medium" },
    { key: "hard",   label: "Hard",   prize: 500, set: "hard" }
  ],
  lifelines: {
    removeWrong: { label: "Remove a wrong answer", cost: 50 },
    stopClock:   { label: "Stop the clock",        cost: 50 },
    phoneFriend: { label: "Ask Dec",               cost: 75 }
  },
  phoneFriendMessage: "Ask Dec! Take your time.",
  storageKey: "melsQuiz.bestWinnings",
  leaderboardUrl: "",   // the shared leaderboard; empty = switched off and hidden
  maxNameLength: 20,
  nameStorageKey: "melsQuiz.playerName"
};
```

Change a number or the wording, save, and refresh the page. (If you change the prizes or lifeline costs a lot, her old best winnings will still be shown. To start the best-winnings record afresh, change `storageKey` to a new name.)

## Shared leaderboard (optional)

When `leaderboardUrl` in `CONFIG` is filled in, players can add their name to a shared top 10:

- After a game where they won more than £0, the end screen has a name box and an **Add me to the leaderboard** button. The top 10 is then shown with their entry highlighted.
- The start screen has a **Leaderboard** button to look at the top 10 at any time.
- If the leaderboard can't be reached, the game says so kindly and carries on working.
- When `leaderboardUrl` is empty (`""`), all the leaderboard buttons are hidden and the game works exactly as before.

The scores live in a small Cloudflare Worker with a D1 database, in the `leaderboard/` folder. See `leaderboard/README.md` for the exact steps to set it up. Only the name, score and date are stored, there's no swear filter, and the name is only ever shown as plain text.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page |
| `style.css` | Colours and big, readable layout |
| `game.js` | The game itself, with the `CONFIG` at the top |
| `questions.js` | All the questions - **this is the one to edit** |
| `tests/check-questions.js` | Checks the question file is tidy (needs Node.js) |
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

It checks each set has the right number of questions, that every question has 4 different options and a valid answer, and that no question appears twice (even across sets). If you add questions, update the `EXPECTED` numbers at the top of that file.

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
