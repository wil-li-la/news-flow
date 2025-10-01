#!/bin/bash

echo "🚀 Starting iOS build process for TestFlight..."

# Check if logged into EAS
echo "📋 Checking EAS login status..."
if ! eas whoami > /dev/null 2>&1; then
    echo "❌ Not logged into EAS. Please run: eas login"
    exit 1
fi

# Check if project is linked
echo "📋 Checking project configuration..."
if ! grep -q "projectId" app.json; then
    echo "🔗 Linking project to EAS..."
    eas init
fi

echo "🏗️ Building for iOS (production profile)..."
eas build --platform ios --profile production

echo "✅ Build complete! Next steps:"
echo "1. Wait for build to finish in EAS dashboard"
echo "2. Download the .ipa file"
echo "3. Upload to App Store Connect"
echo "4. Submit to TestFlight"