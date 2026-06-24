# ⚡ Commandes de Build — Référence Rapide
## PRO DIGITALIX v1.0.0 — ANABOK GROUP

---

## VÉRIFICATION BUILD (TypeScript)

```bash
# Frontend — 0 erreur attendu
cd frontend && npx tsc --noEmit

# Backend — 0 erreur attendu
cd backend && npx tsc --noEmit
```

---

## 🌐 WEB / PWA

```bash
cd frontend

# Build production
NEXT_PUBLIC_API_URL=https://api.prodigitalix.com/api/v1 npm run build

# Résultat : frontend/.next/
# → Déployé automatiquement via Docker
```

---

## 📱 ANDROID

```bash
# Prérequis : Java 17+, Android Studio, ANDROID_HOME
export KEYSTORE_PASSWORD="votre_mot_de_passe_keystore"
export KEY_PASSWORD="votre_mot_de_passe_cle"

bash RELEASE/android/BUILD-ANDROID.sh

# Résultats :
# RELEASE/android/PRO-DIGITALIX-debug.apk           (test téléphone)
# RELEASE/android/PRO-DIGITALIX-v1.0.0-release.apk  (distribution directe)
# RELEASE/android/PRO-DIGITALIX-v1.0.0-playstore.aab (Google Play Store)
```

**Générer le keystore (une seule fois) :**
```bash
keytool -genkey -v \
  -keystore frontend/android/prodigitalix.jks \
  -alias prodigitalix \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass VOTRE_MOT_DE_PASSE \
  -keypass VOTRE_MOT_DE_PASSE_CLE \
  -dname "CN=PRO DIGITALIX, O=ANABOK GROUP, C=TG"
```

---

## 🍎 iOS (macOS requis)

```bash
# Prérequis : macOS + Xcode 15 + CocoaPods + Apple Developer Account
export APPLE_TEAM_ID="VOTRE_TEAM_ID_APPLE"

bash RELEASE/ios/BUILD-IOS.sh

# Résultat :
# RELEASE/ios/PRO-DIGITALIX-v1.0.0.ipa
```

---

## 🪟 WINDOWS EXE

```bat
:: Prérequis : Node.js 20+
:: Double-cliquer sur :
RELEASE\windows\BUILD-WINDOWS.bat

:: Résultats dans dist-electron/ :
:: "PRO DIGITALIX Setup 1.0.0.exe"   (installateur)
:: "PRO DIGITALIX 1.0.0.exe"          (portable)
```

**Via ligne de commande :**
```bash
npm install --legacy-peer-deps
npx tsc -p electron/tsconfig.json
electron-builder --win --x64 --config electron/electron-builder.yml
```

---

## 🐳 DÉPLOIEMENT PRODUCTION (Docker)

```bash
# Sur le VPS
cd /opt/prodigitalix

# Setup VPS (une seule fois)
bash RELEASE/deploy/SETUP-VPS-RAPIDE.sh

# SSL (une seule fois)
bash scripts/ssl-setup.sh

# Déploiement complet
bash scripts/deploy.sh

# Mise à jour
git pull origin main && docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🗄️ BASE DE DONNÉES (Supabase)

```sql
-- Exécuter dans l'éditeur SQL Supabase
-- Copier/coller le contenu de scripts/supabase-setup.sql
```

---

## 🔍 VÉRIFICATIONS

```bash
# Santé API
curl https://api.prodigitalix.com/health

# Frontend
curl -I https://prodigitalix.com

# Webhook (test)
curl -X POST https://api.prodigitalix.com/api/v1/subscription/webhook/chariow \
  -H "Content-Type: application/json" \
  -H "x-chariow-signature: TEST" \
  -d '{}'

# Logs
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## 📦 RÉSUMÉ DES FICHIERS DE SORTIE

| Plateforme | Commande | Fichier de sortie |
|-----------|---------|-------------------|
| Web/PWA | `npm run build` | `.next/standalone/` |
| Android APK | `BUILD-ANDROID.sh` | `PRO-DIGITALIX-v1.0.0-release.apk` |
| Android AAB | (inclus) | `PRO-DIGITALIX-v1.0.0-playstore.aab` |
| iOS IPA | `BUILD-IOS.sh` *(macOS)* | `PRO-DIGITALIX-v1.0.0.ipa` |
| Windows EXE | `BUILD-WINDOWS.bat` | `PRO DIGITALIX Setup 1.0.0.exe` |
| Windows Portable | (inclus) | `PRO DIGITALIX 1.0.0.exe` |

---

*PRO DIGITALIX v1.0.0 — ANABOK GROUP*
