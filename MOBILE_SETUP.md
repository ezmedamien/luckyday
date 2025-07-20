# 📱 LuckyDay Mobile App Setup

## 🚀 Quick Start

### 1. Install Expo Go on Your Phone
- **iOS:** [App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android:** [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 2. Start the Mobile App
```bash
npm run mobile
# Then choose option 2: "Start Expo Mobile App"
```

Or directly:
```bash
npx expo start
```

### 3. Scan QR Code
- **iOS:** Use Camera app or Expo Go app
- **Android:** Use Expo Go app

## 🛠️ Development Commands

```bash
# Start mobile development
npm run expo

# Start on specific platform
npm run expo:android
npm run expo:ios
npm run expo:web

# Build for production
eas build

# Submit to app stores
eas submit
```

## 📁 Project Structure

```
luckyday/
├── App.tsx              # Mobile app entry point
├── app.json             # Expo configuration
├── eas.json             # EAS build configuration
├── index.js             # Expo entry point
├── src/                 # Next.js web app
└── scripts/
    └── mobile-dev.js    # Development helper
```

## 🔧 Configuration Files

### app.json
- Expo app configuration
- App metadata and settings
- Linked to EAS project ID: `e76a1cf4-0b7b-4f4c-855c-53b97a9d31fa`

### eas.json
- EAS build profiles
- Development, preview, and production builds

## 📱 Mobile App Features

- **🎰 Number Generator:** Generate random lotto numbers
- **💾 Save Combos:** Save your favorite combinations
- **🗑️ Delete Saved:** Remove unwanted combinations
- **🎨 Color-coded Balls:** Numbers 1-10: red, 11-20: teal, 21-30: blue, 31-40: green, 41-45: yellow

## 🌐 Web vs Mobile

- **Web App:** Full-featured with advanced generation methods, historical data, and detailed UI
- **Mobile App:** Simplified version optimized for touch interaction

## 🚀 Deployment

### Development Build
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Production Build
```bash
eas build --profile production --platform all
```

### Submit to Stores
```bash
eas submit --platform ios
eas submit --platform android
```

## 🔄 No Conflicts

The mobile setup is completely separate from your Next.js web app:
- ✅ No conflicts with existing Next.js setup
- ✅ Can run both simultaneously
- ✅ Different entry points and configurations
- ✅ Shared business logic can be extracted later

## 📞 Support

If you encounter issues:
1. Check Expo documentation: https://docs.expo.dev/
2. Check EAS documentation: https://docs.expo.dev/eas/
3. Ensure all dependencies are installed: `npm install` 