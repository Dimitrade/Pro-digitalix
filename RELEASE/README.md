# 📦 PRO DIGITALIX v1.0.0 — Dossier RELEASE
## ANABOK GROUP — anabokgroup@gmail.com

---

## CONTENU DU DOSSIER

```
RELEASE/
│
├── README.md                          ← Ce fichier
├── COMMANDES-BUILD.md                 ← Référence rapide toutes commandes
│
├── android/
│   ├── BUILD-ANDROID.sh               ← Script build APK + AAB (Linux/macOS)
│   ├── GUIDE-PLAYSTORE.md             ← Guide publication Google Play Store
│   ├── PRO-DIGITALIX-debug.apk        ← APK debug (test, après build)
│   ├── PRO-DIGITALIX-v1.0.0-release.apk  ← APK release signé (après build)
│   └── PRO-DIGITALIX-v1.0.0-playstore.aab ← AAB Play Store (après build)
│
├── ios/
│   ├── BUILD-IOS.sh                   ← Script build IPA (macOS uniquement)
│   ├── GUIDE-APPSTORE.md              ← Guide publication App Store
│   └── PRO-DIGITALIX-v1.0.0.ipa      ← IPA App Store (après build macOS)
│
├── windows/
│   ├── BUILD-WINDOWS.bat              ← Script build EXE (Windows)
│   ├── GUIDE-WINDOWS.md               ← Guide distribution Windows
│   ├── PRO DIGITALIX Setup 1.0.0.exe ← Installateur NSIS (après build)
│   └── PRO DIGITALIX 1.0.0.exe       ← Portable (après build)
│
├── pwa/
│   └── GUIDE-PWA.md                   ← Guide PWA + checklist Lighthouse
│
└── deploy/
    ├── GUIDE-DEPLOY-COMPLET.md        ← Guide déploiement production (10 étapes)
    └── SETUP-VPS-RAPIDE.sh            ← Script setup serveur Ubuntu 22.04
```

---

## DÉMARRAGE RAPIDE

### Je veux tester sur Android
```bash
export KEYSTORE_PASSWORD="mon_mot_de_passe"
export KEY_PASSWORD="mon_mot_de_passe_cle"
bash RELEASE/android/BUILD-ANDROID.sh
# → RELEASE/android/PRO-DIGITALIX-v1.0.0-release.apk
```

### Je veux tester sur iPhone (macOS)
```bash
export APPLE_TEAM_ID="MONTEAMID"
bash RELEASE/ios/BUILD-IOS.sh
# → RELEASE/ios/PRO-DIGITALIX-v1.0.0.ipa
```

### Je veux l'EXE Windows
```
Double-cliquer sur RELEASE/windows/BUILD-WINDOWS.bat
# → RELEASE/windows/PRO DIGITALIX Setup 1.0.0.exe
```

### Je veux déployer en production
```bash
# Sur le VPS Ubuntu 22.04
bash RELEASE/deploy/SETUP-VPS-RAPIDE.sh
# Puis remplir backend/.env et frontend/.env.local
bash scripts/ssl-setup.sh
bash scripts/deploy.sh
```

---

## STATUT BUILD

| Plateforme | Prêt à builder | Prérequis |
|-----------|----------------|-----------|
| 🌐 Web/PWA | ✅ | Node.js 20 |
| 📱 Android APK/AAB | ✅ | Java 17 + Android Studio |
| 🍎 iOS IPA | ✅ | macOS + Xcode 15 |
| 🪟 Windows EXE | ✅ | Node.js 20 |
| 🐳 Production Docker | ✅ | VPS Ubuntu + Docker |

---

## TYPESCRIPT — 0 ERREUR CONFIRMÉ

```
✅ frontend : npx tsc --noEmit → EXIT:0
✅ backend  : npx tsc --noEmit → EXIT:0
```

---

## INFORMATIONS PROJET

| Info | Valeur |
|------|--------|
| **Nom** | PRO DIGITALIX |
| **Version** | 1.0.0 |
| **Bundle ID** | com.anabokgroup.prodigitalix |
| **Développeur** | ANABOK GROUP |
| **Email** | anabokgroup@gmail.com |
| **Téléphone** | +228 79 81 29 99 |
| **OWNER** | anabokgroup@gmail.com |
| **Domaine** | prodigitalix.com |
| **API** | api.prodigitalix.com |
| **Checkout** | anabokgroup.online/prd_y2htjbxf/checkout |
| **Prix** | 10 000 FCFA/an |

---

*PRO DIGITALIX — Analysez • Optimisez • Développez*
*Développé par ANABOK GROUP — 2024*
