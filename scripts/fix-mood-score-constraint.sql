-- Fix mood score constraint to allow 1-10 scale instead of 1-5
-- Drop the existing constraint
ALTER TABLE mood_entries DROP CONSTRAINT IF EXISTS mood_entries_mood_score_check;

-- Add the new constraint for 1-10 scale
ALTER TABLE mood_entries ADD CONSTRAINT mood_entries_mood_score_check 
CHECK (mood_score >= 1 AND mood_score <= 10);

-- Update any existing mood entries that might have invalid scores
-- (This is optional, but good for data integrity)
UPDATE mood_entries 
SET mood_score = CASE 
    WHEN mood_score > 10 THEN 10
    WHEN mood_score < 1 THEN 1
    ELSE mood_score
END
WHERE mood_score < 1 OR mood_score > 10; 