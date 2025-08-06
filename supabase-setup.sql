-- =====================================================
-- COMPLETE SUPABASE SETUP FOR LUCKYDAY APP
-- =====================================================

-- Step 1: Create the saved_combos table
CREATE TABLE IF NOT EXISTS saved_combos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers INTEGER[] NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  method TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_combos_user_id ON saved_combos(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_combos_saved_at ON saved_combos(saved_at);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE saved_combos ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own saved combinations" ON saved_combos;
DROP POLICY IF EXISTS "Users can insert their own saved combinations" ON saved_combos;
DROP POLICY IF EXISTS "Users can update their own saved combinations" ON saved_combos;
DROP POLICY IF EXISTS "Users can delete their own saved combinations" ON saved_combos;

-- Step 5: Create new RLS policies for saved_combos
CREATE POLICY "Users can view their own saved combinations" ON saved_combos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved combinations" ON saved_combos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved combinations" ON saved_combos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved combinations" ON saved_combos
  FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Create the weekly_favorites table
CREATE TABLE IF NOT EXISTS weekly_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers INTEGER[] NOT NULL,
  week_start DATE NOT NULL, -- Start of the week (Monday)
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_count INTEGER DEFAULT 0, -- How many times this combination was used this week
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create indexes for weekly_favorites
CREATE INDEX IF NOT EXISTS idx_weekly_favorites_user_id ON weekly_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_favorites_week_start ON weekly_favorites(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_favorites_numbers ON weekly_favorites USING GIN(numbers);

-- Step 8: Enable RLS for weekly_favorites
ALTER TABLE weekly_favorites ENABLE ROW LEVEL SECURITY;

-- Step 9: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own weekly favorites" ON weekly_favorites;
DROP POLICY IF EXISTS "Users can insert their own weekly favorites" ON weekly_favorites;
DROP POLICY IF EXISTS "Users can update their own weekly favorites" ON weekly_favorites;
DROP POLICY IF EXISTS "Users can delete their own weekly favorites" ON weekly_favorites;

-- Step 10: Create new RLS policies for weekly_favorites
CREATE POLICY "Users can view their own weekly favorites" ON weekly_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly favorites" ON weekly_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly favorites" ON weekly_favorites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly favorites" ON weekly_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Step 11: Create a function to get the start of the week
CREATE OR REPLACE FUNCTION get_week_start(input_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  -- Get Monday of the current week
  RETURN input_date - (EXTRACT(DOW FROM input_date) - 1)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create a function to upsert weekly favorites
CREATE OR REPLACE FUNCTION upsert_weekly_favorite(
  p_user_id UUID,
  p_numbers INTEGER[],
  p_week_start DATE DEFAULT get_week_start()
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO weekly_favorites (user_id, numbers, week_start, used_count, last_used_at)
  VALUES (p_user_id, p_numbers, p_week_start, 1, NOW())
  ON CONFLICT (user_id, numbers, week_start)
  DO UPDATE SET
    used_count = weekly_favorites.used_count + 1,
    last_used_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 13: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON saved_combos TO authenticated;
GRANT ALL ON weekly_favorites TO authenticated;
GRANT EXECUTE ON FUNCTION get_week_start(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_weekly_favorite(UUID, INTEGER[], DATE) TO authenticated;

-- Step 14: Create a test function to verify authentication
CREATE OR REPLACE FUNCTION test_auth_function()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'authenticated', auth.uid() IS NOT NULL,
    'user_id', auth.uid(),
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_auth_function() TO authenticated;

-- Step 15: Verify tables exist and are accessible
DO $$
BEGIN
  -- Check if tables exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saved_combos') THEN
    RAISE EXCEPTION 'saved_combos table does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'weekly_favorites') THEN
    RAISE EXCEPTION 'weekly_favorites table does not exist';
  END IF;
  
  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE tablename = 'saved_combos' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on saved_combos';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE tablename = 'weekly_favorites' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on weekly_favorites';
  END IF;
  
  RAISE NOTICE 'All tables and policies created successfully!';
END $$; 