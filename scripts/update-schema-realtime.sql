-- Enable real-time for all necessary tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE user_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE mood_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE journal_entries;

-- Create or replace the increment function for safe care points updates
CREATE OR REPLACE FUNCTION increment_care_points(user_id_param UUID, points_to_add INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_total INTEGER;
BEGIN
    UPDATE users 
    SET care_points = COALESCE(care_points, 0) + points_to_add,
        updated_at = NOW()
    WHERE id = user_id_param
    RETURNING care_points INTO new_total;
    
    RETURN COALESCE(new_total, 0);
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to update user stats with streak calculation
CREATE OR REPLACE FUNCTION update_user_stats_with_streak(
    user_id_param UUID,
    points_to_add INTEGER DEFAULT 0,
    activity_type TEXT DEFAULT 'general'
)
RETURNS TABLE(
    current_streak INTEGER,
    mood_streak INTEGER,
    journal_streak INTEGER,
    total_points INTEGER,
    level INTEGER
) AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    calculated_streak INTEGER := 0;
    calculated_mood_streak INTEGER := 0;
    calculated_journal_streak INTEGER := 0;
    new_total_points INTEGER;
    new_level INTEGER;
    existing_stats RECORD;
BEGIN
    -- Get existing stats
    SELECT * INTO existing_stats 
    FROM user_stats 
    WHERE user_id = user_id_param;
    
    -- Calculate current overall streak (mood OR journal activity)
    WITH daily_activities AS (
        SELECT DISTINCT DATE(created_at) as activity_date
        FROM (
            SELECT created_at FROM mood_entries WHERE user_id = user_id_param
            UNION ALL
            SELECT created_at FROM journal_entries WHERE user_id = user_id_param
        ) combined_activities
        ORDER BY activity_date DESC
    ),
    consecutive_days AS (
        SELECT 
            activity_date,
            ROW_NUMBER() OVER (ORDER BY activity_date DESC) as rn,
            activity_date - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY activity_date DESC) - 1) as expected_date
        FROM daily_activities
    )
    SELECT COUNT(*) INTO calculated_streak
    FROM consecutive_days
    WHERE activity_date = expected_date::date
    AND activity_date <= today_date;
    
    -- Calculate mood-specific streak
    WITH mood_days AS (
        SELECT DISTINCT DATE(created_at) as activity_date
        FROM mood_entries 
        WHERE user_id = user_id_param
        ORDER BY activity_date DESC
    ),
    consecutive_mood_days AS (
        SELECT 
            activity_date,
            ROW_NUMBER() OVER (ORDER BY activity_date DESC) as rn,
            activity_date - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY activity_date DESC) - 1) as expected_date
        FROM mood_days
    )
    SELECT COUNT(*) INTO calculated_mood_streak
    FROM consecutive_mood_days
    WHERE activity_date = expected_date::date
    AND activity_date <= today_date;
    
    -- Calculate journal-specific streak
    WITH journal_days AS (
        SELECT DISTINCT DATE(created_at) as activity_date
        FROM journal_entries 
        WHERE user_id = user_id_param
        ORDER BY activity_date DESC
    ),
    consecutive_journal_days AS (
        SELECT 
            activity_date,
            ROW_NUMBER() OVER (ORDER BY activity_date DESC) as rn,
            activity_date - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY activity_date DESC) - 1) as expected_date
        FROM journal_days
    )
    SELECT COUNT(*) INTO calculated_journal_streak
    FROM consecutive_journal_days
    WHERE activity_date = expected_date::date
    AND activity_date <= today_date;
    
    -- Ensure minimum streak of 1 if there's activity today
    IF calculated_streak = 0 AND points_to_add > 0 THEN
        calculated_streak := 1;
    END IF;
    
    IF calculated_mood_streak = 0 AND activity_type = 'mood' THEN
        calculated_mood_streak := 1;
    END IF;
    
    IF calculated_journal_streak = 0 AND activity_type = 'journal' THEN
        calculated_journal_streak := 1;
    END IF;
    
    -- Calculate new totals
    new_total_points := COALESCE(existing_stats.total_points, 0) + points_to_add;
    new_level := GREATEST(1, (new_total_points / 100) + 1);
    
    -- Update or insert user stats
    INSERT INTO user_stats (
        user_id, 
        current_streak, 
        mood_streak,
        journal_streak,
        total_points, 
        level,
        longest_streak,
        total_checkins,
        updated_at
    ) VALUES (
        user_id_param,
        calculated_streak,
        calculated_mood_streak,
        calculated_journal_streak,
        new_total_points,
        new_level,
        GREATEST(COALESCE(existing_stats.longest_streak, 0), calculated_streak),
        COALESCE(existing_stats.total_checkins, 0) + CASE WHEN points_to_add > 0 THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_streak = calculated_streak,
        mood_streak = calculated_mood_streak,
        journal_streak = calculated_journal_streak,
        total_points = new_total_points,
        level = new_level,
        longest_streak = GREATEST(user_stats.longest_streak, calculated_streak),
        total_checkins = COALESCE(user_stats.total_checkins, 0) + CASE WHEN points_to_add > 0 THEN 1 ELSE 0 END,
        updated_at = NOW();
    
    -- Return the calculated values
    RETURN QUERY SELECT 
        calculated_streak,
        calculated_mood_streak,
        calculated_journal_streak,
        new_total_points,
        new_level;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date ON mood_entries(user_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_users_care_points ON users(care_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_points ON user_stats(total_points DESC);

-- Ensure RLS is properly configured
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
    -- Users table policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view all profiles') THEN
        CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (true);
    END IF;
    
    -- User stats policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can view all stats') THEN
        CREATE POLICY "Users can view all stats" ON user_stats FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can update own stats') THEN
        CREATE POLICY "Users can update own stats" ON user_stats FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can insert own stats') THEN
        CREATE POLICY "Users can insert own stats" ON user_stats FOR INSERT WITH CHECK (true);
    END IF;
END $$;
