-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE,
  twitter_username TEXT,
  twitter_name TEXT,
  twitter_avatar_url TEXT,
  care_points INTEGER DEFAULT 0,
  self_care_points INTEGER DEFAULT 0,
  care_objective_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create check_ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  emotions TEXT[],
  notes TEXT,
  gratitude TEXT,
  public_gratitude BOOLEAN DEFAULT FALSE,
  care_points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  target_days INTEGER DEFAULT 7,
  frequency TEXT DEFAULT 'Daily',
  points_per_completion INTEGER DEFAULT 15,
  bonus_points INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goal_completions table
CREATE TABLE IF NOT EXISTS goal_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  care_points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, user_id, completed_date)
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- 'streak_7', 'streak_14', 'streak_30', etc.
  title TEXT NOT NULL,
  description TEXT,
  nft_token_id TEXT,
  nft_contract_address TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata_url TEXT
);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  care_points_earned INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_public_gratitude ON check_ins(public_gratitude, created_at DESC) WHERE public_gratitude = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_care_points ON users(care_points DESC);
CREATE INDEX IF NOT EXISTS idx_goal_completions_user_date ON goal_completions(user_id, completed_date DESC);
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id, claimed_at DESC);

-- Create function to update user streaks
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  current_streak_count INTEGER := 0;
  check_date DATE;
  expected_date DATE;
BEGIN
  -- Get the most recent check-in date
  SELECT date INTO check_date 
  FROM check_ins 
  WHERE user_id = user_uuid 
  ORDER BY date DESC 
  LIMIT 1;
  
  -- If no check-ins, streak is 0
  IF check_date IS NULL THEN
    UPDATE users SET current_streak = 0 WHERE id = user_uuid;
    RETURN 0;
  END IF;
  
  -- Start from today and count backwards
  expected_date := CURRENT_DATE;
  
  -- Check if there's a check-in for today or yesterday (to account for timezone differences)
  IF check_date < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Streak is broken
    UPDATE users SET current_streak = 0 WHERE id = user_uuid;
    RETURN 0;
  END IF;
  
  -- Count consecutive days
  FOR check_date IN 
    SELECT date 
    FROM check_ins 
    WHERE user_id = user_uuid 
    ORDER BY date DESC
  LOOP
    IF check_date = expected_date OR check_date = expected_date - INTERVAL '1 day' THEN
      current_streak_count := current_streak_count + 1;
      expected_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  -- Update user's current streak and longest streak
  UPDATE users 
  SET 
    current_streak = current_streak_count,
    longest_streak = GREATEST(longest_streak, current_streak_count),
    updated_at = NOW()
  WHERE id = user_uuid;
  
  RETURN current_streak_count;
END;
$$ LANGUAGE plpgsql;
