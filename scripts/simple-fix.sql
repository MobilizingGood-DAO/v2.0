-- Simple fix for immediate database issues
-- Run this in your Supabase SQL editor

-- 1. Ensure users table has the required columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS care_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_checkin_date DATE;

-- 2. Create user_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_checkin DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- 4. Create basic RLS policies (allow all operations for now)
DROP POLICY IF EXISTS "Allow all users operations" ON users;
CREATE POLICY "Allow all users operations" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all user_stats operations" ON user_stats;
CREATE POLICY "Allow all user_stats operations" ON user_stats FOR ALL USING (true);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- 6. Ensure existing users have user_stats records
INSERT INTO user_stats (user_id, current_streak, longest_streak, total_checkins, total_points, level)
SELECT id, 0, 0, 0, 0, 1
FROM users
WHERE id NOT IN (SELECT user_id FROM user_stats)
ON CONFLICT (user_id) DO NOTHING; 