-- Ensure mood_entries table exists with proper structure
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
  notes TEXT,
  activities TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure user_stats table exists with proper structure
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  mood_streak INTEGER DEFAULT 0,
  journal_streak INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create or replace the increment_user_stats function
CREATE OR REPLACE FUNCTION increment_user_stats(
  p_user_id UUID,
  p_activity_type TEXT
) RETURNS VOID AS $$
BEGIN
  -- Insert or update user stats
  INSERT INTO user_stats (user_id, total_checkins, updated_at)
  VALUES (p_user_id, 1, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_checkins = user_stats.total_checkins + 1,
    updated_at = NOW();

  -- Update specific streaks based on activity type
  IF p_activity_type = 'mood_check' THEN
    UPDATE user_stats 
    SET mood_streak = mood_streak + 1,
        current_streak = current_streak + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF p_activity_type = 'journal' THEN
    UPDATE user_stats 
    SET journal_streak = journal_streak + 1,
        current_streak = current_streak + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Update longest streak if current streak is higher
  UPDATE user_stats 
  SET longest_streak = GREATEST(longest_streak, current_streak),
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on tables
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for mood_entries
DROP POLICY IF EXISTS "Users can view their own mood entries" ON mood_entries;
CREATE POLICY "Users can view their own mood entries" ON mood_entries
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own mood entries" ON mood_entries;
CREATE POLICY "Users can insert their own mood entries" ON mood_entries
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own mood entries" ON mood_entries;
CREATE POLICY "Users can update their own mood entries" ON mood_entries
  FOR UPDATE USING (true);

-- Create RLS policies for user_stats
DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;
CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON mood_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
