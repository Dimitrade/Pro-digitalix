# 🚀 PRO DIGITALIX — Guide de Déploiement Production
### ANABOK GROUP

---

## PRÉREQUIS OBLIGATOIRES

### Serveur VPS
- [ ] Ubuntu 22.04 LTS (minimum 2 vCPU, 4 GB RAM, 40 GB SSD)
- [ ] Docker 24+ et Docker Compose V2 installés
- [ ] Git installé
- [ ] Ports ouverts : 80, 443, 22 (SSH)
- [ ] Nom de domaine `prodigitalix.com` pointant vers l'IP du VPS (DNS A record)
- [ ] Sous-domaine `api.prodigitalix.com` → même IP

### Comptes externes requis
- [ ] **Supabase** — compte créé, projet créé, URL de connexion PostgreSQL disponible
- [ ] **Google Cloud Console** — OAuth 2.0 client ID/Secret créés, domaines autorisés
- [ ] **Firebase** — projet créé, FCM activé, clé de service Admin SDK téléchargée
- [ ] **OpenAI** — clé API disponible
- [ ] **Chariow** — webhook configuré sur votre boutique avec le secret HMAC

### Android (APK/AAB)
- [ ] Java 17 installé (`java --version`)
- [ ] Android Studio installé avec SDK 34
- [ ] Variable `ANDROID_HOME` configurée
- [ ] Keystore signé généré :
  ```bash
  keytool -genkey -v -keystore android/prodigitalix.jks \
    -alias prodigitalix -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Compte Google Play Developer (25 USD unique)

### iOS (IPA)
- [ ] macOS avec Xcode 15+
- [ ] CocoaPods installé (`sudo gem install cocoapods`)
- [ ] Apple Developer Account (99 USD/an)
- [ ] Certificat de distribution et profil de provisioning

### Windows (EXE)
- [ ] Node.js 20+
- [ ] `electron-builder` installé (`npm install -g electron-builder`)
- [ ] Icône `.ico` dans `electron/assets/icon.ico`

---

## ÉTAPES DE DÉPLOIEMENT

### 1. Préparer les fichiers d'environnement
```bash
# Backend
cp backend/.env.production backend/.env
# Remplir TOUTES les valeurs dans backend/.env

# Frontend
cp frontend/.env.production frontend/.env.local
# Remplir TOUTES les valeurs dans frontend/.env.local
```

### 2. Initialiser la base de données Supabase
1. Ouvrir l'éditeur SQL dans votre projet Supabase
2. Copier et exécuter `scripts/supabase-setup.sql`
3. Vérifier que "Setup PRO DIGITALIX terminé ✅" s'affiche

### 3. Configurer le SSL (première fois)
```bash
chmod +x scripts/ssl-setup.sh
./scripts/ssl-setup.sh
```

### 4. Déployer le backend + frontend
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 5. Vérifier le déploiement
```bash
# API
curl https://api.prodigitalix.com/health

# Frontend
curl -I https://prodigitalix.com
```

### 6. Configurer CI/CD GitHub Actions
Dans GitHub Settings → Secrets → Actions, ajouter :
- `VPS_HOST` — IP de votre VPS
- `VPS_USER` — `root` ou utilisateur sudo
- `VPS_SSH_KEY` — clé SSH privée
- `NEXT_PUBLIC_API_URL` — `https://api.prodigitalix.com/api/v1`
- `NEXT_PUBLIC_FIREBASE_API_KEY` — clé Firebase
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` — ID projet Firebase
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- `SLACK_WEBHOOK` — (optionnel) webhook Slack pour alertes deploy

---

## BUILD APPLICATIONS MOBILES & DESKTOP

### Android (APK + AAB)
```bash
# Variables d'environnement
export KEYSTORE_PASSWORD="votre_mot_de_passe"
export KEY_PASSWORD="votre_mot_de_passe_cle"

chmod +x scripts/build-android.sh
./scripts/build-android.sh
```
**Résultats :**
- `frontend/android/app/build/outputs/apk/debug/app-debug.apk` — test direct sur téléphone
- `frontend/android/app/build/outputs/apk/release/app-release.apk` — distribution directe
- `frontend/android/app/build/outputs/bundle/release/app-release.aab` — Google Play Store

### iOS (IPA)
```bash
export APPLE_TEAM_ID="XXXXXXXXXX"
chmod +x scripts/build-ios.sh
./scripts/build-ios.sh
```
**Résultat :** `frontend/ios/build/App.ipa`

### Windows EXE
```bash
chmod +x scripts/build-windows.sh
./scripts/build-windows.sh
```
**Résultats :**
- `dist-electron/PRO DIGITALIX Setup x.x.x.exe` — installateur NSIS
- `dist-electron/PRO DIGITALIX x.x.x.exe` — version portable

### PWA (Progressive Web App)
La PWA est automatiquement disponible via le site web HTTPS.
Vérifications :
- [ ] `manifest.json` accessible : `https://prodigitalix.com/manifest.json`
- [ ] Service Worker actif : DevTools → Application → Service Workers
- [ ] Score Lighthouse PWA ≥ 90

---

## CONFIGURATION WEBHOOK CHARIOW

Dans votre boutique Chariow :
1. Paramètres → Webhooks → Ajouter
2. URL : `https://api.prodigitalix.com/api/v1/subscription/webhook/chariow`
3. Événements : `order.paid`, `subscription.activated`
4. Secret HMAC : valeur de `CHARIOW_WEBHOOK_SECRET` dans `.env`

---

## MONITORING & ALERTES

### Endpoints de santé
| Service | URL |
|---------|-----|
| API | `https://api.prodigitalix.com/health` |
| Frontend | `https://prodigitalix.com` |

### Mode maintenance
Pour activer/désactiver le mode maintenance, modifier `nginx/nginx.conf` :
```nginx
# Décommenter pour maintenance :
# return 503;
```
Puis : `docker compose -f docker-compose.prod.yml exec nginx nginx -s reload`

### Logs
```bash
# Logs API
docker compose -f docker-compose.prod.yml logs -f backend

# Logs Nginx
docker compose -f docker-compose.prod.yml logs -f nginx

# Tous les services
docker compose -f docker-compose.prod.yml logs -f
```

### Sauvegardes
Les sauvegardes PostgreSQL sont automatiques (quotidiennes à 3h UTC).
Emplacement : `/opt/backups/prodigitalix/`
Rétention : 30 jours

---

## VARIABLES D'ENVIRONNEMENT — LISTE COMPLÈTE

### Backend (`backend/.env`)
| Variable | Obligatoire | Description |
|----------|------------|-------------|
| `DATABASE_URL` | ✅ | URL PostgreSQL Supabase (pooler) |
| `JWT_SECRET` | ✅ | Minimum 64 caractères aléatoires |
| `GOOGLE_CLIENT_ID` | ⚠️ | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | ⚠️ | OAuth Google |
| `OPENAI_API_KEY` | ⚠️ | Assistant IA |
| `FIREBASE_PROJECT_ID` | ⚠️ | Push notifications |
| `FIREBASE_PRIVATE_KEY` | ⚠️ | Push notifications |
| `FIREBASE_CLIENT_EMAIL` | ⚠️ | Push notifications |
| `CHARIOW_WEBHOOK_SECRET` | ✅ | Vérification webhook |
| `ENCRYPTION_KEY` | ✅ | 32 caractères exactement |
| `MONITORING_WEBHOOK_URL` | ❌ | Alertes Slack/Discord |

### Frontend (`frontend/.env.local`)
| Variable | Obligatoire | Description |
|----------|------------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | `https://api.prodigitalix.com/api/v1` |
| `NEXTAUTH_URL` | ✅ | `https://prodigitalix.com` |
| `NEXTAUTH_SECRET` | ✅ | Minimum 32 caractères |
| `NEXT_PUBLIC_FIREBASE_*` | ⚠️ | Push notifications web |

---

*Développé par ANABOK GROUP — 2024*
