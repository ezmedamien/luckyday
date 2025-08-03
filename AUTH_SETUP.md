# Authentication Setup Guide

## Overview
This guide will help you set up the authentication system for LuckyDay using Supabase.

## Prerequisites
- Supabase account and project
- Node.js and npm installed

## Setup Steps

### 1. Supabase Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `supabase-setup.sql` to create the necessary table and policies

### 2. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cqwwgxgewemzyddwvoxc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxd3dneGdld2VtenlkZHd2b3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDU2NzMsImV4cCI6MjA2OTc4MTY3M30.LpIa5Yh6YLM5Zt3yOEqWJwLh6t5pWDYaMmv5At4yWwY
```

### 3. Supabase Authentication Settings

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure the following settings:
   - **Site URL**: Your application URL (e.g., `http://localhost:3000` for development)
   - **Redirect URLs**: Add your application URLs where users should be redirected after authentication

### 4. Email Templates (Optional)

1. Go to Authentication > Email Templates
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Magic link

### 5. Testing the Setup

1. Start your development server: `npm run dev`
2. Navigate to your application
3. Click the "로그인" button in the top right
4. Try creating an account and logging in

## Features

### Authentication Features
- ✅ User registration with email/password
- ✅ User login with email/password
- ✅ Password reset functionality
- ✅ User session management
- ✅ Secure logout

### User Management Features
- ✅ User profile display
- ✅ Account creation date
- ✅ User menu with profile and logout options

### Data Persistence Features
- ✅ Save lottery combinations to user account
- ✅ Retrieve saved combinations
- ✅ Delete saved combinations
- ✅ Row Level Security (RLS) for data protection

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Password Requirements**: Minimum 6 characters
- **Email Verification**: Required for new accounts
- **Secure Session Management**: Automatic session handling
- **CSRF Protection**: Built-in protection against cross-site request forgery

## Database Schema

### saved_combos Table
```sql
CREATE TABLE saved_combos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers INTEGER[] NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  method TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check that your Supabase URL and API key are correct
   - Verify that the authentication settings are configured properly

2. **Database errors**
   - Ensure the SQL script has been run successfully
   - Check that RLS policies are in place

3. **Email not sending**
   - Verify email templates are configured
   - Check spam folder for confirmation emails

### Support

If you encounter any issues, please check:
1. Supabase dashboard logs
2. Browser console for JavaScript errors
3. Network tab for failed requests

## Next Steps

After setting up authentication, you can:
1. Add user profile management
2. Implement social login (Google, GitHub, etc.)
3. Add user preferences and settings
4. Implement user analytics and statistics 