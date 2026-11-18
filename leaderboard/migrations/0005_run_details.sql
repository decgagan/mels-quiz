-- Migration number: 0005 	 a few more details per run, for richer leaderboards and profile stats
--
-- Purely additive: three new optional columns. Nothing existing is changed or removed.
-- Runs saved before this migration simply have NULL here, and the game shows "-" or leaves them out of those particular stats.

-- How many of the big "every 10th question" ones were answered right in this endless run.
-- (How many big ones were answered is always the number of questions divided by 10, rounded down.)
ALTER TABLE endless_runs ADD COLUMN big_correct INTEGER;

-- Weekly runs: how many of the ten questions were easy, and how many of each level were answered right.
-- (Medium questions answered = 10 minus answered_easy.)
ALTER TABLE weekly_runs ADD COLUMN answered_easy  INTEGER;
ALTER TABLE weekly_runs ADD COLUMN correct_easy   INTEGER;
ALTER TABLE weekly_runs ADD COLUMN correct_medium INTEGER;
