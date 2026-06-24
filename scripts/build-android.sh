#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# PRO DIGITALIX — Build Android (APK + AAB)
# Prérequis : Node.js, Android Studio, Java 17, ANDROID_HOME
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail
cd "$(dirname "$0")/../frontend"

echo "📱 Build Android PRO DIGITALIX..."

# 1. Export Next.js en mode statique
echo "→ Export statique Next.js..."
CAPACITOR_SERVER_URL="" npm run build
# npm run export  # si next export est configuré

# 2. Sync Capacitor
echo "→ Sync Capacitor..."
npx cap sync android

# 3. Build APK (debug pour test)
echo "→ Build APK Debug..."
cd android
./gradlew assembleDebug
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
echo "✅ APK Debug : android/$APK_PATH"

# 4. Build APK Release (signé)
echo "→ Build APK Release..."
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=prodigitalix.jks \
  -Pandroid.injected.signing.store.password="${KEYSTORE_PASSWORD:-}" \
  -Pandroid.injected.signing.key.alias=prodigitalix \
  -Pandroid.injected.signing.key.password="${KEY_PASSWORD:-}"
echo "✅ APK Release : android/app/build/outputs/apk/release/app-release.apk"

# 5. Build AAB (Google Play Store)
echo "→ Build AAB (Play Store)..."
./gradlew bundleRelease \
  -Pandroid.injected.signing.store.file=prodigitalix.jks \
  -Pandroid.injected.signing.store.password="${KEYSTORE_PASSWORD:-}" \
  -Pandroid.injected.signing.key.alias=prodigitalix \
  -Pandroid.injected.signing.key.password="${KEY_PASSWORD:-}"
echo "✅ AAB : android/app/build/outputs/bundle/release/app-release.aab"

echo ""
echo "🎉 Build Android terminé !"
echo "   APK Debug   → android/app/build/outputs/apk/debug/app-debug.apk"
echo "   APK Release → android/app/build/outputs/apk/release/app-release.apk"
echo "   AAB Release → android/app/build/outputs/bundle/release/app-release.aab"
