# Mel's Quiz

A simple, friendly general knowledge quiz for Mel. 200 easy multiple-choice questions with a UK flavour, played on her own, on a phone or a laptop. No sign-ups, no tracking, no build step - just plain HTML, CSS and JavaScript.

## How to play

1. Open `index.html` in a web browser (or visit the GitHub Pages address once it's switched on - see below).
2. Press **Start a quiz**. You get 10 questions picked at random from the 200, and none repeat within a round.
3. Tap the answer you think is right. The game tells you straight away whether you were right, and shows the correct answer if you weren't.
4. Press **Next question** to carry on. At the end you see your score and a message.
5. Press **Play again** for a fresh round. Your best score is remembered on that device (it's kept in the browser's `localStorage`, so it never leaves the device).

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page |
| `style.css` | Colours and big, readable layout |
| `game.js` | The game itself |
| `questions.js` | All the questions - **this is the one to edit** |
| `tests/check-questions.js` | Checks the question file is tidy (needs Node.js) |

## How to add questions

Open `questions.js` and copy any line inside the list, for example:

```js
{ q: "What is the capital city of France?", options: ["Paris", "Lyon", "Marseille", "Nice"], answer: "Paris" },
```

Then change the question, the four options and the answer. Rules:

- Exactly **4 options**, all different.
- `answer` must be written **exactly** the same as one of the options (same capital letters and spelling).
- Keep the comma at the end of the line, and keep the lines inside the `[ ... ]` brackets.
- If the text contains a double quote `"`, write it as `\"` (single quotes `'` are fine).

The game shuffles the options every time, so it doesn't matter which position the answer is in. New questions are picked up automatically.

To check you haven't made a typo, run this in the project folder (needs [Node.js](https://nodejs.org)):

```
node tests/check-questions.js
```

If you add questions, update the `EXPECTED` number at the top of that file (it checks for 200 at the moment).

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

There's nothing to build, so no extra set-up is needed.
