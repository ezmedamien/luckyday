# Expo Authentication Testing Guide

## When to Test on Expo

### ✅ Test on Localhost First
- Faster development cycle
- Better debugging tools
- Easier OAuth setup
- Immediate feedback

### 📱 Then Test on Expo If Needed
- Mobile-specific UX testing
- Touch interaction verification
- Responsive design validation
- Mobile browser behavior

## Expo Setup for Authentication

### 1. Update Supabase Redirect URLs

Add Expo URLs to your Supabase project:

```
Site URL: exp://192.168.1.100:8081
Redirect URLs: 
- exp://192.168.1.100:8081/auth/callback
- exp://localhost:8081/auth/callback
- exp://127.0.0.1:8081/auth/callback
```

### 2. Update AuthContext for Expo

```typescript
// In src/contexts/AuthContext.tsx
const signInWithProvider = async (provider: 'kakao' | 'naver') => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: provider === 'kakao' ? 'kakao' : 'naver',
    options: {
      redirectTo: Platform.OS === 'web' 
        ? `${window.location.origin}/auth/callback`
        : 'exp://192.168.1.100:8081/auth/callback',
    },
  });
  return { error };
};
```

### 3. Handle Deep Links

Create `app.json` configuration:

```json
{
  "expo": {
    "scheme": "luckyday",
    "web": {
      "bundler": "metro"
    }
  }
}
```

### 4. Test Commands

```bash
# Start Expo development server
npm run expo:web

# Or for mobile
npm run expo:android
npm run expo:ios
```

## Testing Checklist

### Localhost Testing (Priority)
- [ ] Phone OTP authentication
- [ ] Kakao/Naver OAuth
- [ ] Email/password login
- [ ] Guest flow (generate → save → auth modal)
- [ ] Session persistence
- [ ] Error handling

### Expo Testing (Optional)
- [ ] Mobile responsive design
- [ ] Touch interactions
- [ ] Mobile browser compatibility
- [ ] Deep link handling
- [ ] Performance on mobile

## Recommendation

**Start with localhost** - it's faster and easier for initial development and testing. Only move to Expo if you need to test mobile-specific behaviors or want to verify the responsive design on actual devices.

The authentication system works the same way on both platforms, so localhost testing will catch most issues. 