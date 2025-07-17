-- Create RPC function to safely add care points
CREATE OR REPLACE FUNCTION add_care_points(user_id_param UUID, points_to_add INTEGER)
RETURNS JSON AS $$
DECLARE
    current_points INTEGER;
    new_total INTEGER;
BEGIN
    -- Get current points
    SELECT care_points INTO current_points 
    FROM users 
    WHERE id = user_id_param;
    
    -- Calculate new total
    new_total := COALESCE(current_points, 0) + points_to_add;
    
    -- Update user points
    UPDATE users 
    SET care_points = new_total, 
        updated_at = NOW()
    WHERE id = user_id_param;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'previous_points', COALESCE(current_points, 0),
        'points_added', points_to_add,
        'new_total', new_total
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    rank BIGINT,
    user_id UUID,
    username TEXT,
    care_points INTEGER,
    current_streak INTEGER,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY u.care_points DESC) as rank,
        u.id as user_id,
        COALESCE(u.username, 'Anonymous') as username,
        u.care_points,
        COALESCE(us.current_streak, 0) as current_streak,
        COALESCE(us.level, 1) as level
    FROM users u
    LEFT JOIN user_stats us ON u.id = us.user_id
    WHERE u.care_points > 0
    ORDER BY u.care_points DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(
    user_id_param UUID,
    streak_type TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
    current_streak INTEGER;
    new_streak INTEGER;
BEGIN
    -- Get current streak
    EXECUTE format('SELECT %I FROM user_stats WHERE user_id = $1', streak_type)
    INTO current_streak
    USING user_id_param;
    
    -- Calculate new streak
    new_streak := COALESCE(current_streak, 0) + increment_by;
    
    -- Update streak
    EXECUTE format('
        INSERT INTO user_stats (user_id, %I, updated_at) 
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET %I = $2, updated_at = NOW()
    ', streak_type, streak_type)
    USING user_id_param, new_streak;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'streak_type', streak_type,
        'previous_streak', COALESCE(current_streak, 0),
        'new_streak', new_streak
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
