-- Ensure care_transactions table exists with proper structure
CREATE TABLE IF NOT EXISTS care_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 5,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE care_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow read for all users" ON care_transactions;
CREATE POLICY "Allow read for all users" ON care_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON care_transactions;
CREATE POLICY "Allow insert for authenticated users" ON care_transactions FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_care_transactions_from_user ON care_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_care_transactions_to_user ON care_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_care_transactions_post ON care_transactions(post_id);
CREATE INDEX IF NOT EXISTS idx_care_transactions_created_at ON care_transactions(created_at DESC);

-- Ensure post_likes table exists
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS on post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for post_likes
DROP POLICY IF EXISTS "Allow read for all users" ON post_likes;
CREATE POLICY "Allow read for all users" ON post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON post_likes;
CREATE POLICY "Allow insert for authenticated users" ON post_likes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete for like owners" ON post_likes;
CREATE POLICY "Allow delete for like owners" ON post_likes FOR DELETE USING (true);

-- Create indexes for post_likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- Ensure post_comments table exists
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  care_points_earned INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on post_comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for post_comments
DROP POLICY IF EXISTS "Allow read for all users" ON post_comments;
CREATE POLICY "Allow read for all users" ON post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON post_comments;
CREATE POLICY "Allow insert for authenticated users" ON post_comments FOR INSERT WITH CHECK (true);

-- Create indexes for post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);
