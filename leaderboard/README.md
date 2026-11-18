# Mel's Quiz leaderboard (Cloudflare Worker + D1)

The shared back end for Mel's Quiz: player profiles and the leaderboards.

- **Worker name:** `mels-quiz-leaderboard`
- **D1 database name:** `mels-quiz-scores`
- Code: `src/index.js` (the front door), `src/profiles.js` (profiles and sign-in), `src/endless.js` (endless-mode games and leaderboards), `src/util.js` (shared helpers).
- Database tables are made by the files in `migrations/`, in number order: `0001` the old scores table, `0002` profiles, `0003` endless-mode games.

## What it can do

| Address | What it does |
| --- | --- |
| `POST /profiles` | Create a profile: `{ "name", "pin" }`. Returns a sign-in token. |
| `POST /login` | Sign in on a device: `{ "name", "pin" }`. Returns a token. |
| `POST /logout` | Sign this device out. |
| `GET /me` | The signed-in player's stats. |
| `POST /me/delete` | Delete the signed-in player's profile and all their scores. |
| `POST /runs` | Save a finished endless game (signed in). |
| `GET /leaderboard/endless?board=overall` or `board=nolifelines` | Top 10, one row per player (their best game). |
| `GET /scores`, `POST /scores` | The **old** leaderboard from the 10-question game. Kept so the old version of the game keeps working. |

Signed-in requests send `Authorization: Bearer <token>`.

## The rules the Worker enforces

- **Names:** 1 to 20 characters, plain text, and nobody else can have the same one (capital letters don't matter: "Mel" and "mel" are the same). The website only ever shows names as plain text, never as HTML.
- **PINs:** exactly 4 numbers. The PIN is never stored. Each profile stores a PBKDF2-SHA-256 hash (10,000 rounds) with its own random salt. If you want an extra secret on top, run `npx wrangler secret put PIN_PEPPER` once and type any long random phrase (set it **before** people sign up and never change it, or everyone's PIN stops working). It's optional.
- **Wrong PINs:** after 5 wrong PINs in a row a profile is locked for 15 minutes (even the right PIN is refused during that time).
- **Sign-in tokens:** a random 64-character token per device, stored only as a hash on the server. A device stays signed in for 400 days. Each profile keeps its newest 8 signed-in devices.
- **Saving a game** (endless mode): the game must have finished (exactly 3 wrong answers or timeouts), the counts must add up, the score must be a multiple of £25 and no more than those right answers could win (counting the double-prize 10th questions, minus £50 per lifeline used). One game per profile per 10 seconds. Sending the same game twice only saves it once.
- **Creating profiles:** one new profile per 5 seconds per IP address (a simple best-effort limit kept in the Worker's memory).
- Only `https://decgagan.github.io` (and `http://localhost` / `http://127.0.0.1`, for testing) can talk to it from a browser.
- Nothing about IP addresses is stored. There is **no swear filter**.

**If you change the game's prizes, lives, big-question settings or lifeline costs** in `game.js`, change the "game rules" block at the top of `src/endless.js` to match, then deploy again.

## Updating the live Worker (it's already set up)

This is what to do when new versions of these files arrive. **Order matters: do this first, push the website afterwards.** The current live website keeps working while you do it, because the old `/scores` address is still there.

Run these in **PowerShell**, inside the `leaderboard` folder of your copy of the repo (for example `cd C:\Users\decga\mels-quiz\leaderboard`).

**1. Get the new files.** If your copy is a git clone, run `git pull` in the main `mels-quiz` folder first. Otherwise copy the whole `src` and `migrations` folders from the new version over the ones in your `leaderboard` folder.

**2. Add the new tables to the real database** (note `--remote`; answer `y` when it asks to continue). It only adds tables: your old scores are not touched.

```
npx wrangler d1 migrations apply mels-quiz-scores --remote
```

**3. Deploy the Worker:**

```
npx wrangler deploy
```

**4. Check it.** Open `https://mels-quiz-leaderboard.decgagan.workers.dev/leaderboard/endless?board=overall` in a browser. You should see `{"ok":true,"board":"overall","scores":[]}`. Then push the website changes as usual.

## Setting it up from scratch (Windows)

(You only need this section for a brand new Worker and database. Step 4 applies every migration, including the new ones.)

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

**4. Create the tables in the real database** (note the `--remote`; answer `y` when it asks to continue):

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

**6. Check it works.** Paste the address plus `/leaderboard/endless?board=overall` into your browser. You should see:

```
{"ok":true,"board":"overall","scores":[]}
```

**7. Switch it on in the game.** In `game.js` (top of the file, in `CONFIG`), set:

```js
leaderboardUrl: "https://mels-quiz-leaderboard.YOUR-NAME.workers.dev",
```

(just the address, without `/scores`), commit, and push. Until `leaderboardUrl` is filled in, the game hides the leaderboard and works exactly as before.

## Handy extras

See the players:

```
npx wrangler d1 execute mels-quiz-scores --remote --command "SELECT id, name, created_at, games_played, best_endless FROM profiles ORDER BY id DESC LIMIT 30"
```

See the latest games:

```
npx wrangler d1 execute mels-quiz-scores --remote --command "SELECT r.id, p.name, r.score, r.lifelines, r.created_at FROM endless_runs r JOIN profiles p ON p.id = r.profile_id ORDER BY r.id DESC LIMIT 20"
```

Remove one cheeky game (use the `id` from the list above). Their `games_played` stays as it was, which is fine:

```
npx wrangler d1 execute mels-quiz-scores --remote --command "DELETE FROM endless_runs WHERE id = 5"
```

Remove a player and everything of theirs (use the `id` from the players list; run all three, in this order):

```
npx wrangler d1 execute mels-quiz-scores --remote --command "DELETE FROM endless_runs WHERE profile_id = 7"
npx wrangler d1 execute mels-quiz-scores --remote --command "DELETE FROM sessions WHERE profile_id = 7"
npx wrangler d1 execute mels-quiz-scores --remote --command "DELETE FROM profiles WHERE id = 7"
```

Free someone who is locked out of their profile (put in their name in lower case):

```
npx wrangler d1 execute mels-quiz-scores --remote --command "UPDATE profiles SET failed_attempts = 0, locked_until = 0 WHERE name_key = 'mel'"
```

(If someone forgets their PIN, the simplest fix is to delete their profile with the commands above so they can make a new one.)

## Trying it on your own computer first (optional)

```
npx wrangler d1 migrations apply mels-quiz-scores --local
npx wrangler dev --var CREATE_SECONDS:0 RATE_LIMIT_SECONDS:0
```

That runs the Worker at `http://localhost:8787` with a throwaway local database (the two `--var` bits switch the speed limits off so tests aren't slowed down). In another window, from the main folder, `node tests/api-smoke.mjs` tries everything end to end. To play with it in the browser, temporarily put `http://localhost:8787` in `leaderboardUrl` and open the site from `http://localhost` (for example `python -m http.server 8000`). Don't commit that change.
