# Assets Required for iOS App Store

You need to create these image files before building for TestFlight:

## Required Images:
- **icon.png** - 1024x1024px - App icon for App Store
- **adaptive-icon.png** - 1024x1024px - Android adaptive icon foreground
- **splash.png** - 1284x2778px - iOS splash screen image
- **favicon.png** - 48x48px - Web favicon

## Image Requirements:
- All images should be PNG format
- App icon should have no transparency
- Use your NewsFlow branding colors and logo
- Splash screen should match your app's design theme

## Temporary Solution:
For now, you can use Expo's default assets by running:
```bash
npx create-expo-app --template blank-typescript temp-assets
cp temp-assets/assets/* ./assets/
rm -rf temp-assets
```

## Production Assets:
Before App Store submission, replace with your custom NewsFlow branded images.