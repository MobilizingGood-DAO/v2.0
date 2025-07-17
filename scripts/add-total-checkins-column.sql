-- Add total_checkins column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_checkins INTEGER DEFAULT 0;

-- Update existing users to have a default value
UPDATE users SET total_checkins = 0 WHERE total_checkins IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_total_checkins ON users(total_checkins);
