-- Create mood_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON mood_entries(created_at);

-- Enable RLS
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view their own mood entries" ON mood_entries
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert their own mood entries" ON mood_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update their own mood entries" ON mood_entries
  FOR UPDATE USING (true);

-- Grant permissions
GRANT ALL ON mood_entries TO authenticated;
GRANT ALL ON mood_entries TO anon;
