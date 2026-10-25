CREATE TABLE IF NOT EXISTS stitch_consents (
  session_id TEXT PRIMARY KEY,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  adult_confirmed INTEGER NOT NULL CHECK (adult_confirmed = 1),
  accepted_at INTEGER NOT NULL
);
