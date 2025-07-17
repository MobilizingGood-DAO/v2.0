-- Drop and recreate the users table with all required columns
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT 'Anonymous User',
    care_points INTEGER DEFAULT 0,
    total_checkins INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_checkin_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_care_points ON users(care_points DESC);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (true);

-- Insert some sample data for testing
INSERT INTO users (wallet_address, name, care_points, total_checkins, current_streak, longest_streak) VALUES
('0x1234567890123456789012345678901234567890', 'Alice', 150, 15, 5, 10),
('0x2345678901234567890123456789012345678901', 'Bob', 120, 12, 3, 8),
('0x3456789012345678901234567890123456789012', 'Charlie', 200, 20, 7, 12);
