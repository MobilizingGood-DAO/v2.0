-- Add missing columns to user_stats table
ALTER TABLE user_stats 
  ADD COLUMN IF NOT EXISTS mood_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS journal_streak INTEGER DEFAULT 0;

-- Update existing records to have default values
UPDATE user_stats 
SET mood_streak = 0, journal_streak = 0 
WHERE mood_streak IS NULL OR journal_streak IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_stats_streaks ON user_stats(mood_streak, journal_streak);

-- Update the streak calculation function to handle the new columns properly
CREATE OR REPLACE FUNCTION update_user_stats_with_streak(user_uuid UUID, activity_type TEXT, base_points INTEGER)
RETURNS JSON AS $$
DECLARE
    current_streak INTEGER;
    mood_streak_count INTEGER := 0;
    journal_streak_count INTEGER := 0;
    streak_multiplier DECIMAL;
    final_points INTEGER;
    current_stats RECORD;
    new_level INTEGER;
BEGIN
    -- Calculate current overall streak
    current_streak := calculate_user_streak(user_uuid);
    
    -- Calculate specific activity streaks
    IF activity_type = 'mood' THEN
        mood_streak_count := current_streak;
        -- Get existing journal streak
        SELECT COALESCE(journal_streak, 0) INTO journal_streak_count 
        FROM user_stats WHERE user_id = user_uuid;
    ELSIF activity_type = 'journal' THEN
        journal_streak_count := current_streak;
        -- Get existing mood streak
        SELECT COALESCE(mood_streak, 0) INTO mood_streak_count 
        FROM user_stats WHERE user_id = user_uuid;
    END IF;
    
    -- Get streak multiplier based on overall streak
    streak_multiplier := get_streak_multiplier(current_streak);
    
    -- Calculate final points with multiplier
    final_points := FLOOR(base_points * streak_multiplier);
    
    -- Get current user stats
    SELECT * INTO current_stats 
    FROM user_stats 
    WHERE user_id = user_uuid;
    
    -- Calculate new level (every 100 points = 1 level)
    new_level := FLOOR((COALESCE(current_stats.total_points, 0) + final_points) / 100) + 1;
    
    -- Update or insert user stats
    INSERT INTO user_stats (
        user_id,
        total_points,
        total_checkins,
        current_streak,
        longest_streak,
        level,
        last_checkin,
        mood_streak,
        journal_streak,
        updated_at
    ) VALUES (
        user_uuid,
        final_points,
        1,
        current_streak,
        current_streak,
        new_level,
        CURRENT_DATE,
        mood_streak_count,
        journal_streak_count,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = COALESCE(user_stats.total_points, 0) + final_points,
        total_checkins = COALESCE(user_stats.total_checkins, 0) + 1,
        current_streak = current_streak,
        longest_streak = GREATEST(COALESCE(user_stats.longest_streak, 0), current_streak),
        level = new_level,
        last_checkin = CURRENT_DATE,
        mood_streak = mood_streak_count,
        journal_streak = journal_streak_count,
        updated_at = NOW();
    
    -- Update user care points
    UPDATE users 
    SET care_points = COALESCE(care_points, 0) + final_points,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'base_points', base_points,
        'streak_days', current_streak,
        'multiplier', streak_multiplier,
        'final_points', final_points,
        'new_level', new_level,
        'mood_streak', mood_streak_count,
        'journal_streak', journal_streak_count
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
