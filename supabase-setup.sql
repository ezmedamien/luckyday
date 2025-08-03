-- Create the saved_combos table
CREATE TABLE IF NOT EXISTS saved_combos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers INTEGER[] NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  method TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_combos_user_id ON saved_combos(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_combos_saved_at ON saved_combos(saved_at);

-- Enable Row Level Security (RLS)
ALTER TABLE saved_combos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own saved combinations
CREATE POLICY "Users can view their own saved combinations" ON saved_combos
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own saved combinations
CREATE POLICY "Users can insert their own saved combinations" ON saved_combos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own saved combinations
CREATE POLICY "Users can update their own saved combinations" ON saved_combos
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own saved combinations
CREATE POLICY "Users can delete their own saved combinations" ON saved_combos
  FOR DELETE USING (auth.uid() = user_id); 