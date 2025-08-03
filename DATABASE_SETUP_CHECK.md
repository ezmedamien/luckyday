# Database Setup Check

## Issue: Can't Save Numbers

The most likely cause is that the `saved_combos` table hasn't been created in your Supabase database.

## Quick Fix

### 1. Check if Table Exists
1. Go to your Supabase Dashboard
2. Navigate to **Table Editor**
3. Look for `saved_combos` table
4. If it doesn't exist, create it

### 2. Create the Table
If the table doesn't exist, run this SQL in your Supabase SQL Editor:

```sql
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
```

### 3. Test the Setup
1. **Login** with email/password
2. **Generate numbers**
3. **Try to save** - check browser console for logs
4. **Check Supabase logs** for any errors

## Debug Steps

### 1. Check Browser Console
Open browser dev tools and look for:
- `"Attempting to save combo:"` log
- `"saveCombo called with:"` log
- Any error messages

### 2. Check Supabase Logs
1. Go to Supabase Dashboard
2. Navigate to **Logs**
3. Look for any errors related to `saved_combos`

### 3. Test Database Connection
Add this to your page temporarily to test:

```typescript
// Test database connection
useEffect(() => {
  const testDB = async () => {
    const { data, error } = await supabase
      .from('saved_combos')
      .select('count')
      .limit(1);
    
    console.log('Database test:', { data, error });
  };
  
  testDB();
}, []);
```

## Common Issues

### 1. Table Doesn't Exist
**Solution**: Run the SQL script above

### 2. RLS Policies Missing
**Solution**: Make sure all policies are created

### 3. User Not Authenticated
**Solution**: Check if user is properly logged in

### 4. Network Error
**Solution**: Check Supabase URL and API key

## Quick Test

After setting up the table:

1. **Login** with email/password
2. **Generate some numbers**
3. **Click save button**
4. **Check console logs**
5. **Check if numbers appear in saved list**

If you see console logs but no saved numbers, the issue is likely with the database setup. 