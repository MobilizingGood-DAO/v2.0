-- Create function to safely increment user care points
CREATE OR REPLACE FUNCTION increment_user_care_points(p_user_id UUID, p_points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET care_points = COALESCE(care_points, 0) + p_points,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- If no rows were updated, the user doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with id % not found', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_user_care_points(UUID, INTEGER) TO authenticated;
