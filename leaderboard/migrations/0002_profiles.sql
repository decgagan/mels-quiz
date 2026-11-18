-- Migration number: 0002 	 player profiles and sign-in sessions
--
-- The old `scores` table from 0001 is NOT touched. It keeps the scores from the original
-- 10-question game (the old leaderboard).

CREATE TABLE profiles (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,                -- as the player typed it
  name_key        TEXT    NOT NULL UNIQUE,         -- lower-case copy, so "Mel" and "mel" are the same player
  pin_hash        TEXT    NOT NULL,                -- "pbkdf2-sha256:iterations:salt:hash". The PIN itself is never stored.
  created_at      TEXT    NOT NULL,
  games_played    INTEGER NOT NULL DEFAULT 0,      -- finished endless runs
  total_correct   INTEGER NOT NULL DEFAULT 0,      -- right answers, endless + weekly
  best_endless    INTEGER NOT NULL DEFAULT 0,
  failed_attempts INTEGER NOT NULL DEFAULT 0,      -- wrong PINs in a row
  locked_until    INTEGER NOT NULL DEFAULT 0       -- milliseconds since 1970; sign-in is blocked until then
);

-- One row per signed-in device. Only a hash of the random token is stored.
CREATE TABLE sessions (
  token_hash TEXT    PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL                      -- milliseconds since 1970
);
CREATE INDEX idx_sessions_profile ON sessions (profile_id);
