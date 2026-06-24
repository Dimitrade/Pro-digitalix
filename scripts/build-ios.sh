#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# PRO DIGITALIX — Build iOS
# Prérequis : macOS, Xcode 15+, CocoaPods, Apple Developer Account
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail
cd "$(dirname "$0")/../frontend"

echo "🍎 Build iOS PRO DIGITALIX..."

# 1. Export Next.js
echo "→ Export statique Next.js..."
npm run build

# 2. Sync Capacitor iOS
echo "→ Sync Capacitor iOS..."
npx cap sync ios

# 3. Installer les pods CocoaPods
echo "→ Installation CocoaPods..."
cd ios/App
pod install --repo-update
cd ../..

# 4. Build pour simulateur (test)
echo "→ Build simulateur iPhone..."
xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -sdk iphonesimulator \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  build | xcpretty

echo "✅ Build simulateur terminé"

# 5. Build IPA Release (App Store)
echo "→ Build IPA Release..."
xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -sdk iphoneos \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM="${APPLE_TEAM_ID:-}" | xcpretty

xcodebuild \
  -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build/ \
  -exportOptionsPlist ios/ExportOptions.plist | xcpretty

echo "✅ IPA : ios/build/App.ipa"
echo ""
echo "→ Upload App Store Connect avec Transporter ou:"
echo "   xcrun altool --upload-app -f build/App.ipa -u votre@email.com -p @keychain:AC_PASSWORD"
