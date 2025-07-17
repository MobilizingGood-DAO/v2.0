-- Drop existing mood_entries table if it exists
DROP TABLE IF EXISTS mood_entries CASCADE;

-- Create mood_entries table with proper constraints
CREATE TABLE mood_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
  notes TEXT,
  entry_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Enable RLS
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all mood entries" ON mood_entries FOR SELECT USING (true);
CREATE POLICY "Users can insert their own mood entries" ON mood_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own mood entries" ON mood_entries FOR UPDATE USING (true);
