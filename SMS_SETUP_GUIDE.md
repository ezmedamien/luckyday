# SMS OTP Setup Guide

## Option 1: Twilio (Recommended for Production)

### 1. Sign up for Twilio
- Go to [twilio.com](https://twilio.com)
- Create a free account
- Get your Account SID and Auth Token

### 2. Configure in Supabase
1. Go to Supabase Dashboard → Authentication → Settings
2. Scroll to "SMS Provider"
3. Select "Twilio"
4. Enter your Twilio credentials:
   - Account SID
   - Auth Token
   - From Phone Number (your Twilio number)

### 3. Test with Korean Numbers
- Use a real Korean phone number (+82)
- Twilio supports Korean numbers
- OTP will be sent via SMS

## Option 2: Supabase Local Development (Free Testing)

### 1. Use Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Start local development
supabase start
```

### 2. Test with Any Number
- Use any phone number (e.g., +1234567890)
- OTP will be logged in console
- No real SMS sent

## Option 3: Mock Testing (Development Only)

### 1. Create Test Environment
Add to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_MOCK_SMS=true
```

### 2. Modify AuthContext for Testing
```typescript
// In src/contexts/AuthContext.tsx
const sendOTP = async (phone: string) => {
  if (process.env.NEXT_PUBLIC_MOCK_SMS === 'true') {
    // Mock OTP for testing
    console.log(`Mock OTP sent to ${phone}: 123456`);
    return { error: null };
  }
  
  const { error } = await supabase.auth.signInWithOtp({
    phone: phone.startsWith('+') ? phone : `+82${phone.replace(/^0/, '')}`,
  });
  return { error };
};
```

## Quick Test Setup

### For Immediate Testing:
1. **Use Email/Password** - Works immediately
2. **Use Mock SMS** - Add the mock environment variable
3. **Use Supabase Local** - For full OTP testing

### Test Phone Numbers:
- **Korean**: +82-10-1234-5678
- **US**: +1-555-123-4567
- **Any**: +1234567890 (for mock testing)

## Production Setup

For production, you'll need:
1. **Twilio account** with Korean number support
2. **Supabase SMS configuration**
3. **Proper error handling**
4. **Rate limiting**

## Recommendation

**Start with Email/Password testing** - it works immediately and is sufficient for most testing scenarios. Add SMS later when you need phone authentication. 