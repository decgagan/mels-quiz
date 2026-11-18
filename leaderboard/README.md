# Mel's Quiz leaderboard (Cloudflare Worker + D1)

The shared back end for Mel's Quiz: player profiles and the leaderboards.

- **Worker name:** `mels-quiz-leaderboard`
- **D1 database name:** `mels-quiz-scores`
- Code: `src/index.js` (the front door), `src/profiles.js` (profiles and sign-in), `src/endless.js` (endless-mode games and leaderboards), `src/weekly.js` (the weekly challenge), `src/util.js` (shared helpers).
- Database tables are made by the files in `migrations/`, in number order: `0001` the old scores table, `0002` profiles, `0003` endless-mode games, `0004` weekly challenge runs, `0005` a few extra details per run (big-question and weekly easy/medium counts, for the richer leaderboard rows and stats page).

## What it can do

| Address | What it does |
| --- | --- |
| `POST /profiles` | Create a profile: `{ "name", "pin" }`. Returns a sign-in token. |
| `POST /login` | Sign in on a device: `{ "name", "pin" }`. Returns a token. |
| `POST /logout` | Sign this device out. |
| `GET /me` | The signed-in player's name and basic counters. |
| `GET /me/stats` | The signed-in player's full stats page (totals, accuracy, money, by difficulty, big questions, lifelines, weekly), worked out from their saved games. |
| `POST /me/delete` | Delete the signed-in player's profile and all their scores. |
| `POST /runs` | Save a finished endless game (signed in). The reply's `rank` / `rankNoLifelines` is the place of *this game* on the board (players on equal scores share a place), or `null` if it isn't one of the player's best 3 there. |
| `GET /leaderboard/endless?board=overall` or `board=nolifelines` | Top 25 entries. Each player can hold up to their best 3 games on it (for `nolifelines`, their best 3 games with no lifelines). A player can therefore appear up to 3 times. |
| `GET /weekly/state` | This week's key (the Monday's date), when it ends, and the signed-in player's runs. |
| `POST /weekly/start` | Start a topic (`{ "slot": 0 }`, 0 to 2). Refused if that topic was already started this week. |
| `POST /weekly/finish` | Save a finished weekly run. |
| `GET /weekly/leaderboard` | This week's top 10 runs, **all three topics together**. Each finished topic run is its own row (so a player can appear up to three times), with its topic number (`slot`). An old-style `?slot=` is ignored. |
| `GET /scores`, `POST /scores` | The **old** leaderboard from the 10-question game. Kept so the old version of the game keeps working. |

Signed-in requests send `Authorization: Bearer <token>`.

## The rules the Worker enforces

- **Names:** 1 to 20 characters, plain text, and nobody else can have the same one (capital letters don't matter: "Mel" and "mel" are the same). The website only ever shows names as plain text, never as HTML.
- **PINs:** exactly 4 numbers. The PIN is never stored. Each profile stores a PBKDF2-SHA-256 hash (10,000 rounds) with its own random salt. If you want an extra secret on top, run `npx wrangler secret put PIN_PEPPER` once and type any long random phrase (set it **before** people sign up and never change it, or everyone's PIN stops working). It's optional.
- **Wrong PINs:** after 5 wrong PINs in a row a profile is locked for 15 minutes (even the right PIN is refused during that time).
- **Sign-in tokens:** a random 64-character token per device, stored only as a hash on the server. A device stays signed in for 400 days. Each profile keeps its newest 8 signed-in devices.
- **Saving a game** (endless mode): the game must have finished (exactly 3 wrong answers or timeouts), the counts must add up (and, if the game says how many big questions were right, those must fit too), the score must be a multiple of £25 and no more than those right answers could win (counting the double-prize 10th questions, plus one extra copy of the biggest prize answered right if Double or nothing was used, minus each lifeline's cost: £50 for Remove a wrong answer, Stop the clock, Ask Dec and Swap the question, £25 for Hint and Double or nothing). One game per profile per 10 seconds. Sending the same game twice only saves it once.
- **Weekly challenge:** the week runs Monday 00:00 to the next Monday 00:00 **UK time** (Europe/London, including summer time), worked out by the Worker. A profile can **start** each of the three topics once a week (the row is saved when it starts, so a refresh can't give a retry). A finished run must be 10 questions, a multiple of £25 and no more than the right answers could win (£100 per easy, £250 per medium, or £250 each if the game didn't send the easy/medium split), plus one doubled prize if Double or nothing was used, minus each lifeline's cost (£50, or £25 for Hint and Double or nothing). Allowed lifelines: `removeWrong`, `stopClock`, `phoneFriend`, `hint`, `swap`, `double`, each at most once. It can't be finished within 15 seconds of starting (the game just asks the player to try saving again a moment later) or more than 3 hours after. There is one weekly board for all three topics: each finished topic run is its own row (scores are never added together), best 10 by score, shown with the player's name, topic and whether they used lifelines. Nothing is deleted at the weekend: a new week simply has a new key, so its board starts empty.
- **Creating profiles:** one new profile per 5 seconds per IP address (a simple best-effort limit kept in the Worker's memory).
- Only `https://decgagan.github.io` (and `http://localhost` / `http://127.0.0.1`, for testing) can talk to it from a browser.
- Nothing about IP addresses is stored. There is **no swear filter**.

**If you change the game's prizes, lives, big-question settings, lifeline costs or the weekly set-up** in `game.js`, change the "game rules" blocks at the top of `src/endless.js` and `src/weekly.js` to match, then deploy again. (Adding new weekly *questions* needs no Worker change.)

## Updating the live Worker (it's already set up)

This is what to do when new versions of these files arrive. **Order matters: do this first, push the website afterwards.** The current live website keeps working while you do it, because the old `/scores` address is still there.

Run these in **PowerShell**, inside the `leaderboard` folder of your copy of the repo (for example `cd C:\Users\decga\mels-quiz\leaderboard`).

**1. Get the new files.** If your copy is a git clone, run `git pull` in the main `mels-quiz` folder first. Otherwise copy the whole `src` and `migrations` folders from the new version over the ones in your `leaderboard` folder.

**2. Add the new tables to the real database** (this applies whatever hasn't been applied yet; at the moment that is `0005`) (note `--remote`; answer `y` when it asks to continue). It only adds three empty optional columns: nothing existing is changed and no scores are touched. **Do this before step 3**, because the new Worker saves into those columns.

```
npx wrangler d1 migrations apply mels-quiz-scores --remote
```

**3. Deploy the Worker:**

```
npx wrangler deploy
```

**4. Check it.** Open `https://mels-quiz-leaderboard.decgagan.workers.dev/weekly/state` in a browser. You should see something like `{"ok":true,"week":{"key":"2026-11-16","endsAt":"2026-11-23T00:00:00.000Z"},"signedIn":false,"runs":[]}`. (The `key` is the Monday of the current week.) Then push the website changes as usual.

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

Remove a player and everything of theirs (use the `id` from the players list; run all four, in this order):

```
npx wrangler d1 execute mels-quiz-scores --remote --command "DELETE FROM weekly_runs WHERE profile_id = 7"
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
npx wrangler dev --var CREATE_SECONDS:0 RATE_LIMIT_SECONDS:0 WEEKLY_MIN_SECONDS:3
```

That runs the Worker at `http://localhost:8787` with a throwaway local database (the `--var` bits switch the speed limits off, and make a weekly run take at least 3 seconds instead of 15, so tests aren't slowed down). In another window, from the main folder, `node tests/api-smoke.mjs` tries everything end to end (it expects a fresh local database, with nobody else on the leaderboards). `node tests/check-worker.mjs` checks the rules, including the Monday-midnight week change either side of the clocks going forward and back, with no server at all. To play with it in the browser, temporarily put `http://localhost:8787` in `leaderboardUrl` and open the site from `http://localhost` (for example `python -m http.server 8000`). Don't commit that change.
