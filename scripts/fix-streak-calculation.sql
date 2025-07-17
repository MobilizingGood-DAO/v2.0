-- Create a simpler, more reliable streak calculation function
CREATE OR REPLACE FUNCTION calculate_simple_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    check_date DATE;
    has_activity BOOLEAN;
BEGIN
    -- Start from today and count backwards
    check_date := CURRENT_DATE;
    
    -- Count consecutive days with activity (mood or journal)
    FOR i IN 0..365 LOOP
        SELECT EXISTS(
            SELECT 1 FROM daily_checkins 
            WHERE user_id = user_uuid 
            AND date = check_date
            AND (mood IS NOT NULL OR (gratitude_note IS NOT NULL AND gratitude_note != ''))
        ) INTO has_activity;
        
        IF has_activity THEN
            streak_count := streak_count + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            -- If it's the first day (today) and no activity, streak is 0
            IF i = 0 THEN
                RETURN 0;
            END IF;
            -- Otherwise, break the loop
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_simple_streak(UUID) TO anon, authenticated;

-- Create function to award points and update streaks
CREATE OR REPLACE FUNCTION award_activity_points(
    user_uuid UUID,
    activity_type TEXT,
    base_points INTEGER
)
RETURNS JSON AS $$
DECLARE
    current_streak INTEGER;
    multiplier DECIMAL;
    final_points INTEGER;
    current_stats RECORD;
    new_total_points INTEGER;
    new_level INTEGER;
    new_care_points INTEGER;
BEGIN
    -- Calculate current streak
    current_streak := calculate_simple_streak(user_uuid);
    
    -- If this is the first activity today, streak should be at least 1
    IF current_streak = 0 THEN
        current_streak := 1;
    END IF;
    
    -- Calculate multiplier
    IF current_streak >= 14 THEN
        multiplier := 2.0;
    ELSIF current_streak >= 7 THEN
        multiplier := 1.5;
    ELSIF current_streak >= 3 THEN
        multiplier := 1.25;
    ELSE
        multiplier := 1.0;
    END IF;
    
    -- Calculate final points
    final_points := FLOOR(base_points * multiplier);
    
    -- Get current stats
    SELECT * INTO current_stats FROM user_stats WHERE user_id = user_uuid;
    
    -- Calculate new totals
    new_total_points := COALESCE(current_stats.total_points, 0) + final_points;
    new_level := FLOOR(new_total_points / 100) + 1;
    
    -- Update or create user stats
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
        new_total_points,
        1,
        current_streak,
        current_streak,
        new_level,
        CURRENT_DATE,
        CASE WHEN activity_type = 'mood' THEN current_streak ELSE COALESCE(current_stats.mood_streak, 0) END,
        CASE WHEN activity_type = 'journal' THEN current_streak ELSE COALESCE(current_stats.journal_streak, 0) END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = new_total_points,
        total_checkins = COALESCE(user_stats.total_checkins, 0) + 1,
        current_streak = current_streak,
        longest_streak = GREATEST(COALESCE(user_stats.longest_streak, 0), current_streak),
        level = new_level,
        last_checkin = CURRENT_DATE,
        mood_streak = CASE 
            WHEN activity_type = 'mood' THEN current_streak 
            ELSE COALESCE(user_stats.mood_streak, 0)
        END,
        journal_streak = CASE 
            WHEN activity_type = 'journal' THEN current_streak 
            ELSE COALESCE(user_stats.journal_streak, 0)
        END,
        updated_at = NOW();
    
    -- Update user care points
    SELECT care_points INTO new_care_points FROM users WHERE id = user_uuid;
    new_care_points := COALESCE(new_care_points, 0) + final_points;
    
    UPDATE users 
    SET care_points = new_care_points,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'base_points', base_points,
        'streak_days', current_streak,
        'multiplier', multiplier,
        'final_points', final_points,
        'new_level', new_level,
        'new_care_points', new_care_points
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION award_activity_points(UUID, TEXT, INTEGER) TO anon, authenticated;
