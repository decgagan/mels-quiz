-- Migration number: 0004 	 weekly challenge runs

-- One row per profile, per week, per topic slot (0, 1, 2). The row is made when the run STARTS,
-- so refreshing the page can't give a second go.
CREATE TABLE weekly_runs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id  INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_key    TEXT    NOT NULL,                    -- the Monday the week began, UK date, e.g. 2026-11-16
  slot        INTEGER NOT NULL,                    -- which of the week's three topics
  started_at  TEXT    NOT NULL,
  finished_at TEXT,                                -- NULL until the run is finished
  score       INTEGER NOT NULL DEFAULT 0,
  correct     INTEGER NOT NULL DEFAULT 0,
  wrong       INTEGER NOT NULL DEFAULT 0,
  lifelines   TEXT    NOT NULL DEFAULT '',
  UNIQUE (profile_id, week_key, slot)
);
CREATE INDEX idx_weekly_rank ON weekly_runs (week_key, slot, score DESC, finished_at ASC, id ASC);
