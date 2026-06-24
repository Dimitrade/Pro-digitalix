# PRO DIGITALIX v1.0.0 — RELEASE FINAL
## ANABOK GROUP — anabokgroup@gmail.com

---

## FICHIERS GÉNÉRÉS ✅

### Windows (PRÊTS — générés le 24/06/2026)

| Fichier | Type | Taille | Statut |
|---------|------|--------|--------|
| `windows/PRO DIGITALIX Setup 1.0.0.exe` | Installateur NSIS (x64+ia32) | ~145 Mo | ✅ PRÊT |
| `windows/PRO DIGITALIX 1.0.0.exe` | Portable x64 | ~75 Mo | ✅ PRÊT |

### Android (À GÉNÉRER — prérequis manquants)

| Fichier | Type | Statut |
|---------|------|--------|
| `android/PRO-DIGITALIX-debug.apk` | APK test | ⏳ Java 17 requis |
| `android/PRO-DIGITALIX-v1.0.0-release.apk` | APK signé | ⏳ Java 17 + keystore requis |
| `android/PRO-DIGITALIX-v1.0.0.aab` | AAB Play Store | ⏳ Java 17 + Android SDK requis |

### iOS (À GÉNÉRER — macOS requis)

| Fichier | Type | Statut |
|---------|------|--------|
| `ios/PRO-DIGITALIX-v1.0.0.ipa` | IPA App Store | ⏳ macOS + Xcode 15 requis |

---

## INSTALLATION WINDOWS

### Option 1 — Installateur (recommandé)
Double-cliquer sur `windows/PRO DIGITALIX Setup 1.0.0.exe`
- Installe dans `C:\Program Files\PRO DIGITALIX\`
- Crée raccourci Bureau + Menu Démarrer
- Désinstallateur inclus

### Option 2 — Portable (sans installation)
Double-cliquer sur `windows/PRO DIGITALIX 1.0.0.exe`
- S'exécute directement, sans installer
- Idéal pour tester ou distribuer sur clé USB

---

## GÉNÉRER L'APK ANDROID

### Prérequis à installer
1. **Java 17 JDK** : https://adoptium.net/temurin/releases/?version=17
2. **Android Studio** : https://developer.android.com/studio
   - SDK Tools : Android 14 (API 34) minimum
3. **Capacitor** dans le projet frontend :
   ```bash
   cd frontend
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap add android
   ```

### Commandes build
```bash
cd frontend
npm run build
npx cap sync android
bash android/BUILD-ANDROID.sh
# → RELEASE-FINAL/android/PRO-DIGITALIX-v1.0.0-release.apk
```

Voir `guides/GUIDE-PLAYSTORE.md` pour la publication Play Store.

---

## GÉNÉRER L'IPA iOS

Requis : **macOS avec Xcode 15** + compte Apple Developer (99$/an)

```bash
cd frontend
npm install @capacitor/ios
npx cap add ios
npm run build && npx cap sync ios
bash ios/BUILD-IOS.sh
```

Voir `guides/GUIDE-APPSTORE.md` pour la publication App Store.

---

## DÉPLOIEMENT PRODUCTION

Voir `guides/GUIDE-DEPLOY-COMPLET.md` pour le déploiement VPS Ubuntu.

Stack : Docker + Nginx + PostgreSQL + SSL Let's Encrypt

```bash
# Sur VPS Ubuntu 22.04
bash scripts/deploy.sh
```

---

## STRUCTURE DU RELEASE

```
RELEASE-FINAL/
├── README.md                              ← Ce fichier
├── windows/
│   ├── PRO DIGITALIX Setup 1.0.0.exe     ← Installateur ✅ PRÊT
│   └── PRO DIGITALIX 1.0.0.exe           ← Portable ✅ PRÊT
├── android/
│   └── BUILD-ANDROID.sh                  ← Script build (Java 17 requis)
├── ios/                                   ← (macOS requis pour builder)
└── guides/
    ├── GUIDE-PLAYSTORE.md                 ← Publication Android
    ├── GUIDE-APPSTORE.md                  ← Publication iOS
    ├── GUIDE-WINDOWS.md                   ← Distribution Windows
    └── GUIDE-DEPLOY-COMPLET.md            ← Déploiement production
```

---

*PRO DIGITALIX v1.0.0 — Build Windows généré le 24/06/2026*
*ANABOK GROUP © 2024 — anabokgroup@gmail.com*
