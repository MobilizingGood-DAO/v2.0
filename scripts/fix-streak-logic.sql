-- Drop existing streak function and recreate with proper logic
DROP FUNCTION IF EXISTS update_user_streak(UUID);
DROP FUNCTION IF EXISTS calculate_streak(UUID);

-- Create function to calculate consecutive days streak
CREATE OR REPLACE FUNCTION calculate_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak_count INTEGER := 0;
    check_date DATE;
    expected_date DATE;
    has_activity BOOLEAN;
BEGIN
    -- Start from today and count backwards
    expected_date := CURRENT_DATE;
    
    -- Check if there's any activity today (mood or journal)
    SELECT EXISTS(
        SELECT 1 FROM daily_checkins 
        WHERE user_id = user_uuid 
        AND date = CURRENT_DATE
        AND (mood IS NOT NULL OR gratitude_note IS NOT NULL)
    ) INTO has_activity;
    
    -- If no activity today, check yesterday to see if streak is broken
    IF NOT has_activity THEN
        SELECT EXISTS(
            SELECT 1 FROM daily_checkins 
            WHERE user_id = user_uuid 
            AND date = CURRENT_DATE - INTERVAL '1 day'
            AND (mood IS NOT NULL OR gratitude_note IS NOT NULL)
        ) INTO has_activity;
        
        -- If no activity yesterday either, streak is 0
        IF NOT has_activity THEN
            RETURN 0;
        END IF;
        
        -- Start counting from yesterday
        expected_date := CURRENT_DATE - INTERVAL '1 day';
    END IF;
    
    -- Count consecutive days with activity
    WHILE expected_date >= CURRENT_DATE - INTERVAL '365 days' LOOP
        SELECT EXISTS(
            SELECT 1 FROM daily_checkins 
            WHERE user_id = user_uuid 
            AND date = expected_date
            AND (mood IS NOT NULL OR gratitude_note IS NOT NULL)
        ) INTO has_activity;
        
        IF has_activity THEN
            current_streak_count := current_streak_count + 1;
            expected_date := expected_date - INTERVAL '1 day';
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    RETURN current_streak_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate streak multiplier
CREATE OR REPLACE FUNCTION get_streak_multiplier(streak_days INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    IF streak_days >= 14 THEN
        RETURN 2.0;
    ELSIF streak_days >= 7 THEN
        RETURN 1.5;
    ELSIF streak_days >= 3 THEN
        RETURN 1.25;
    ELSE
        RETURN 1.0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user stats with proper streak calculation
CREATE OR REPLACE FUNCTION update_user_stats_with_streak(user_uuid UUID, activity_type TEXT, base_points INTEGER)
RETURNS JSON AS $$
DECLARE
    current_streak INTEGER;
    streak_multiplier DECIMAL;
    final_points INTEGER;
    current_stats RECORD;
    new_level INTEGER;
BEGIN
    -- Calculate current streak
    current_streak := calculate_user_streak(user_uuid);
    
    -- Get streak multiplier
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
        CASE WHEN activity_type = 'mood' THEN current_streak ELSE 0 END,
        CASE WHEN activity_type = 'journal' THEN current_streak ELSE 0 END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = COALESCE(user_stats.total_points, 0) + final_points,
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
        'new_level', new_level
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
GRANT EXECUTE ON FUNCTION calculate_user_streak(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_streak_multiplier(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user_stats_with_streak(UUID, TEXT, INTEGER) TO anon, authenticated;

-- Create trigger function to automatically update streaks
CREATE OR REPLACE FUNCTION trigger_update_streak()
RETURNS TRIGGER AS $$
DECLARE
    activity_type TEXT;
    base_points INTEGER := 10;
BEGIN
    -- Determine activity type and base points
    IF NEW.mood IS NOT NULL AND (OLD.mood IS NULL OR OLD IS NULL) THEN
        activity_type := 'mood';
        base_points := 10;
    ELSIF NEW.gratitude_note IS NOT NULL AND NEW.gratitude_note != '' AND 
          (OLD.gratitude_note IS NULL OR OLD.gratitude_note = '' OR OLD IS NULL) THEN
        activity_type := 'journal';
        base_points := 15;
    ELSE
        -- No new activity, just return
        RETURN NEW;
    END IF;
    
    -- Update stats with streak calculation
    PERFORM update_user_stats_with_streak(NEW.user_id, activity_type, base_points);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on daily_checkins
DROP TRIGGER IF EXISTS trigger_streak_update ON daily_checkins;
CREATE TRIGGER trigger_streak_update
    AFTER INSERT OR UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_streak();
