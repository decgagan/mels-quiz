# Mel's Quiz leaderboard (Cloudflare Worker + D1)

A tiny shared high-score table for Mel's Quiz.

- **Worker name:** `mels-quiz-leaderboard`
- **D1 database name:** `mels-quiz-scores`
- `GET /scores` returns the top 10 (`id`, `name`, `score`, `date`).
- `POST /scores` adds a score. Send JSON like `{"name":"Mel","score":1250}`.
- Only the name, the score and the date are stored. **IP addresses are not stored.**

The rules the Worker enforces:

- The name is trimmed, 1 to 20 characters, plain text (no control characters). The website only ever shows names as plain text, never as HTML.
- The score is a whole number from 1 to 5,000 (10 questions x £500, the most the game can award) and a multiple of 25.
- One successful submit per 10 seconds per IP address (a simple best-effort limit kept in the Worker's memory, not stored anywhere).
- Only `https://decgagan.github.io` (and `http://localhost` / `http://127.0.0.1`, for testing) can talk to it from a browser.
- There is **no swear filter**.

## Putting it online (Windows)

You need [Node.js](https://nodejs.org) installed and to be logged in to Cloudflare with Wrangler. These are for **PowerShell** (or Command Prompt). Run them **in order**.

**0. Check you're set up** (you should see a version number, then your Cloudflare account):

```
node -v
npx wrangler whoami
```

If `whoami` says you're not logged in, run `npx wrangler login` and finish in the browser.

**1. Go to this folder.** Use your own path to the repo; it ends in `\mels-quiz\leaderboard`:

```
cd C:\path\to\mels-quiz\leaderboard
```

**2. Create the database:**

```
npx wrangler d1 create mels-quiz-scores
```

It prints a bit of config containing a line like `database_id = "1234abcd-...."`. Copy that long id (just the part inside the quotes).

> If Wrangler asks *"Would you like Wrangler to add it on your behalf?"*, answer **no** (`n`), because step 3 does it by hand.

**3. Paste the id into `wrangler.toml`.** Open the file:

```
notepad wrangler.toml
```

Replace `PASTE-YOUR-DATABASE-ID-HERE` with the id you copied (keep the quotes), then save and close Notepad. The line should look like:

```
database_id = "1234abcd-0000-1111-2222-333344445555"
```

**4. Create the table in the real database** (note the `--remote`; answer `y` when it asks to continue):

```
npx wrangler d1 migrations apply mels-quiz-scores --remote
```

**5. Deploy the Worker:**

```
npx wrangler deploy
```

When it finishes, it **prints a workers.dev web address** like:

```
https://mels-quiz-leaderboard.YOUR-NAME.workers.dev
```

Copy that address.

**6. Check it works.** Paste the address plus `/scores` into your browser, for example `https://mels-quiz-leaderboard.YOUR-NAME.workers.dev/scores`. You should see:

```
{"scores":[]}
```

**7. Switch it on in the game.** In `game.js` (top of the file, in `CONFIG`), set:

```js
leaderboardUrl: "https://mels-quiz-leaderboard.YOUR-NAME.workers.dev",
```

(just the address, without `/scores`), commit, and push. Until `leaderboardUrl` is filled in, the game hides the leaderboard and works exactly as before.

## Handy extras

Look at the latest scores in the real database:

```
npx wrangler d1 execute mels-quiz-scores --remote --command "SELECT id, name, score, created_at FROM scores ORDER BY id DESC LIMIT 20"
```

Remove one entry (use the `id` from the command above):

```
npx wrangler d1 execute mels-quiz-scores --remote --command "DELETE FROM scores WHERE id = 5"
```

Wipe the whole leaderboard:

```
npx wrangler d1 execute mels-quiz-scores --remote --command "DELETE FROM scores"
```

Changing the game's maximum prize? Change `MAX_SCORE` at the top of `src/index.js` to match (10 x the biggest prize), then run `npx wrangler deploy` again.

## Trying it on your own computer first (optional)

```
npx wrangler d1 migrations apply mels-quiz-scores --local
npx wrangler dev
```

That runs the Worker at `http://localhost:8787` with a throwaway local database. Put `http://localhost:8787` in `leaderboardUrl` and open the site from `http://localhost` (for example `python -m http.server 8000`) to try it.
