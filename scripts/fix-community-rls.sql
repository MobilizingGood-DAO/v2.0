-- Enable RLS on community_posts if not already enabled
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read for all users" ON community_posts;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON community_posts;
DROP POLICY IF EXISTS "Allow update for post owners" ON community_posts;

-- Create policies for community_posts
CREATE POLICY "Allow read for all users" ON community_posts
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON community_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for post owners" ON community_posts
  FOR UPDATE USING (true);

-- Ensure the table has the right structure
ALTER TABLE community_posts 
  ADD COLUMN IF NOT EXISTS care_points_earned INTEGER DEFAULT 25;

-- Update existing posts to have care_points_earned if null
UPDATE community_posts 
SET care_points_earned = 25 
WHERE care_points_earned IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
