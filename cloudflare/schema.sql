-- Run this in the Cloudflare D1 → Console tab once, after creating the database.

CREATE TABLE leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  time INTEGER NOT NULL,
  amount TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_leaderboard_rank ON leaderboard (score DESC, time ASC);

-- Per-IP submission log, used by the Worker for rate limiting.
CREATE TABLE submission_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  ts INTEGER NOT NULL
);

CREATE INDEX idx_submission_log_ip_ts ON submission_log (ip, ts);
