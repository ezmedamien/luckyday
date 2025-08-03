# Account Deletion Setup Guide

## Overview
This guide explains how to set up account deletion functionality for the LuckyDay app.

## Features Added

### 1. Enhanced User Menu
- **Logout**: Improved logout with loading state
- **Account Deletion**: New "계정 삭제" (Delete Account) option
- **Confirmation Modal**: Safe deletion with confirmation dialog

### 2. API Endpoints
- `/api/user/delete-account`: Deletes user data from database
- `/api/user/delete-auth`: Deletes user authentication account

### 3. Security Features
- Confirmation modal with clear warning
- Loading states during operations
- Error handling with user feedback
- Proper cleanup of user data

## Environment Setup

### Required Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Getting the Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "service_role" key (not the anon key)
4. Add it to your environment variables

## Database Setup

Ensure your database has the following table structure:

```sql
-- Saved combinations table
CREATE TABLE IF NOT EXISTS saved_combos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers INTEGER[] NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  method TEXT DEFAULT 'manual',
  description TEXT
);

-- Enable RLS (Row Level Security)
ALTER TABLE saved_combos ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own data
CREATE POLICY "Users can manage their own saved combinations" ON saved_combos
  FOR ALL USING (auth.uid() = user_id);
```

## Usage

### For Users
1. Click on the user menu (top right)
2. Select "계정 삭제" (Delete Account)
3. Confirm the deletion in the modal
4. All data will be permanently deleted

### For Developers
The account deletion process:
1. Deletes user's saved combinations from database
2. Deletes the user account from Supabase Auth
3. Signs out the user
4. Shows success message

## Security Considerations

1. **Service Role Key**: Keep this secure and never expose it in client-side code
2. **Confirmation**: Users must explicitly confirm deletion
3. **Data Cleanup**: All user data is properly removed
4. **Error Handling**: Graceful error handling with user feedback

## Testing

To test the account deletion:

1. Create a test account
2. Save some combinations
3. Try the deletion process
4. Verify data is removed from database
5. Verify user cannot log in after deletion

## Troubleshooting

### Common Issues

1. **Service Role Key Error**: Ensure the service role key is correctly set in environment variables
2. **Permission Denied**: Check that RLS policies are correctly configured
3. **User Not Found**: Verify the user session is valid before deletion

### Debug Steps

1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check Supabase logs for authentication errors
4. Ensure environment variables are loaded correctly

## Future Enhancements

- Add data export before deletion
- Implement account recovery period
- Add admin panel for user management
- Enhanced audit logging 