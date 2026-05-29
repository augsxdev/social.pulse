
-- Music + Auth Upgrade

ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_type TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_thumbnail TEXT;

CREATE TABLE IF NOT EXISTS music_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    music_url TEXT NOT NULL,
    platform TEXT NOT NULL,
    title TEXT,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    use_count INTEGER DEFAULT 1,
    favorite BOOLEAN DEFAULT FALSE
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
