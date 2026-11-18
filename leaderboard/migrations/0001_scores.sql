-- Migration number: 0001 	 create the scores table

CREATE TABLE scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  score      INTEGER NOT NULL,
  created_at TEXT    NOT NULL   -- ISO 8601 date and time, set by the Worker
);

-- Makes "top 10, highest first, earliest wins a tie" quick.
CREATE INDEX idx_scores_rank ON scores (score DESC, created_at ASC, id ASC);
