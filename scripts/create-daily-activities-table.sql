-- Create daily_activities table for tracking user activities and points
CREATE TABLE IF NOT EXISTS daily_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('mood', 'journal', 'checkin', 'community')),
  points_earned INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_id ON daily_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_created_at ON daily_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_type_date ON daily_activities(user_id, activity_type, DATE(created_at));

-- Enable RLS
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own activities" ON daily_activities
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own activities" ON daily_activities
  FOR INSERT WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_daily_activities_updated_at 
  BEFORE UPDATE ON daily_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure user_stats table exists with proper structure
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_checkin DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_stats
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_points ON user_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_current_streak ON user_stats(current_streak DESC);

-- Enable RLS on user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_stats
CREATE POLICY "Users can view all stats" ON user_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own stats" ON user_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (true);

-- Create trigger for user_stats updated_at
CREATE TRIGGER update_user_stats_updated_at 
  BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 