# OAuth Setup Guide (Kakao/Naver)

## Kakao OAuth Setup

### 1. Create Kakao App
1. Go to [developers.kakao.com](https://developers.kakao.com)
2. Create a new app
3. Get your **REST API Key**

### 2. Configure Kakao App
1. **Platform Settings**:
   - Web → Site domain: `http://localhost:3001`
   - Web → Redirect URI: `http://localhost:3001/auth/callback`

2. **Kakao Login Settings**:
   - Redirect URI: `http://localhost:3001/auth/callback`
   - Required scopes: `profile_nickname`, `account_email`

### 3. Configure Supabase
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Kakao**
3. Enter your Kakao **REST API Key**

## Naver OAuth Setup

### 1. Create Naver App
1. Go to [developers.naver.com](https://developers.naver.com)
2. Create a new app
3. Get your **Client ID** and **Client Secret**

### 2. Configure Naver App
1. **Service URL**: `http://localhost:3001`
2. **Callback URL**: `http://localhost:3001/auth/callback`

### 3. Configure Supabase
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Naver**
3. Enter your Naver **Client ID** and **Client Secret**

## Quick Testing Without OAuth

### Option 1: Mock OAuth (Development)
Add to your `.env.local`:
```env
NEXT_PUBLIC_MOCK_OAUTH=true
```

### Option 2: Test with Email Only
- Skip social login for now
- Use email/password authentication
- Add social login later

## Testing Checklist

### ✅ Ready to Test (No Setup Required)
- [ ] Email/Password login
- [ ] Email/Password signup
- [ ] Password reset
- [ ] Guest flow (generate → save → auth modal)

### ⚠️ Needs Setup
- [ ] Phone OTP (SMS provider)
- [ ] Kakao login (OAuth setup)
- [ ] Naver login (OAuth setup)

## Recommendation

**Start with Email/Password testing** - it's the most important flow and works immediately. You can test the complete user journey without setting up SMS or OAuth providers.

### Test the Guest Flow:
1. Generate numbers (works as guest)
2. Try to save → Auth modal opens
3. Use email/password to sign up/login
4. After login → Return to save action
5. Verify saved numbers appear 