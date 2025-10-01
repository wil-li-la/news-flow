# TestFlight Setup Guide

## ✅ EAS Build Setup Complete

Your NewsFlow mobile app is now configured for iOS builds with EAS.

## Next Steps to Deploy to TestFlight:

### 1. **EAS Account Setup**
```bash
# Login to EAS (required)
eas login

# Initialize project (if not done)
eas init
```

### 2. **Apple Developer Account**
- Enroll in Apple Developer Program ($99/year)
- Create App Store Connect app record
- Bundle ID: `com.newsflow.app`

### 3. **Build for iOS**
```bash
# Option 1: Use build script
./build-ios.sh

# Option 2: Direct command
npm run build:ios

# Option 3: Manual EAS command
eas build --platform ios --profile production
```

### 4. **Submit to TestFlight**
```bash
# After build completes
npm run submit:ios
```

## Configuration Files Created:

- ✅ `eas.json` - Build profiles (development, preview, production)
- ✅ `app.json` - Updated with iOS configuration
- ✅ `assets/` - Placeholder app icons and splash screens
- ✅ Build scripts in `package.json`

## Important Notes:

### **Assets (Replace Before Production)**
Current assets are Expo defaults. Replace with NewsFlow branding:
- `assets/icon.png` - 1024x1024px app icon
- `assets/splash.png` - Splash screen image
- `assets/adaptive-icon.png` - Android icon

### **Bundle Identifier**
- iOS: `com.newsflow.app`
- Android: `com.newsflow.app`

### **Backend Ready**
✅ Your backend is fully deployed and production-ready:
- API: `https://oq5bvm222k.execute-api.ap-southeast-2.amazonaws.com/prod`
- Authentication: AWS Cognito
- Database: DynamoDB

## Build Process:
1. Run `eas login`
2. Run `eas init` (if needed)
3. Run `./build-ios.sh` or `npm run build:ios`
4. Wait for build completion (~10-15 minutes)
5. Download .ipa from EAS dashboard
6. Upload to App Store Connect
7. Submit to TestFlight

## Troubleshooting:
- Ensure Apple Developer account is active
- Check bundle identifier matches App Store Connect
- Verify all assets are present and correct dimensions