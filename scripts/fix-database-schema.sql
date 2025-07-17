-- Fix database schema for the mental health app
-- This script ensures all tables and columns exist with proper structure

-- 1. Create user_stats table if it doesn't exist
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

-- 2. Add missing columns to users table if they don't exist
DO $$ 
BEGIN
  -- Add care_points if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'care_points') THEN
    ALTER TABLE users ADD COLUMN care_points INTEGER DEFAULT 0;
  END IF;
  
  -- Add name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
    ALTER TABLE users ADD COLUMN name TEXT;
  END IF;
  
  -- Add wallet_address if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'wallet_address') THEN
    ALTER TABLE users ADD COLUMN wallet_address TEXT;
  END IF;
  
  -- Add twitter_username if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'twitter_username') THEN
    ALTER TABLE users ADD COLUMN twitter_username TEXT;
  END IF;
  
  -- Add twitter_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'twitter_name') THEN
    ALTER TABLE users ADD COLUMN twitter_name TEXT;
  END IF;
  
  -- Add twitter_avatar_url if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'twitter_avatar_url') THEN
    ALTER TABLE users ADD COLUMN twitter_avatar_url TEXT;
  END IF;
  
  -- Add last_checkin_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_checkin_date') THEN
    ALTER TABLE users ADD COLUMN last_checkin_date DATE;
  END IF;
END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_twitter_username ON users(twitter_username);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- 4. Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (true);

-- 6. Create RLS policies for user_stats table
DROP POLICY IF EXISTS "Users can view all user_stats" ON user_stats;
CREATE POLICY "Users can view all user_stats" ON user_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;
CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (true);

-- 7. Create function to ensure user_stats exists for new users
CREATE OR REPLACE FUNCTION ensure_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, current_streak, longest_streak, total_checkins, total_points, level)
  VALUES (NEW.id, 0, 0, 0, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically create user_stats for new users
DROP TRIGGER IF EXISTS trigger_ensure_user_stats ON users;
CREATE TRIGGER trigger_ensure_user_stats
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_stats();

-- 9. Ensure existing users have user_stats records
INSERT INTO user_stats (user_id, current_streak, longest_streak, total_checkins, total_points, level)
SELECT id, 0, 0, 0, 0, 1
FROM users
WHERE id NOT IN (SELECT user_id FROM user_stats)
ON CONFLICT (user_id) DO NOTHING;
