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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_care_points(UUID, INTEGER) TO anon, authenticated;
