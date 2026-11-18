-- Migration number: 0003 	 endless-mode runs (the new main game)

-- One row per finished endless run.
CREATE TABLE endless_runs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id      INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  run_id          TEXT    NOT NULL,                -- random id made by the game, so a retry can't save a run twice
  score           INTEGER NOT NULL,
  answered_easy   INTEGER NOT NULL,
  answered_medium INTEGER NOT NULL,
  answered_hard   INTEGER NOT NULL,
  correct_easy    INTEGER NOT NULL,
  correct_medium  INTEGER NOT NULL,
  correct_hard    INTEGER NOT NULL,
  lifelines       TEXT    NOT NULL DEFAULT '',     -- comma-separated names of the lifelines used, '' for none
  created_at      TEXT    NOT NULL,
  UNIQUE (profile_id, run_id)
);
CREATE INDEX idx_endless_rank ON endless_runs (score DESC, created_at ASC, id ASC);
CREATE INDEX idx_endless_profile ON endless_runs (profile_id);
