
-- Pulse Admin Upgrade
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS admin_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT,
    action TEXT,
    target_user TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
