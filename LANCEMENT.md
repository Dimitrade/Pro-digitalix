# 🚀 PRO DIGITALIX — Checklist de Lancement Commercial
### ANABOK GROUP — 2024

---

## COMMANDES DE BUILD FINALES

### 🌐 PWA (Web)
```bash
cd frontend
npm run build
# Output dans frontend/.next/standalone
# Vérifier manifest.json : https://prodigitalix.com/manifest.json
# Tester Lighthouse PWA : score ≥ 90
```

### 📱 Android APK + AAB
```bash
# Prérequis : Android Studio, Java 17, ANDROID_HOME
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android

# Générer le keystore (une seule fois)
keytool -genkey -v -keystore android/prodigitalix.jks \
  -alias prodigitalix -keyalg RSA -keysize 2048 -validity 10000

# Build
export KEYSTORE_PASSWORD="votre_mot_de_passe"
export KEY_PASSWORD="votre_mot_de_passe_cle"
cd ..
./scripts/build-android.sh

# Résultats :
# APK direct   → frontend/android/app/build/outputs/apk/release/app-release.apk
# AAB PlayStore → frontend/android/app/build/outputs/bundle/release/app-release.aab
```

### 🍎 iOS IPA
```bash
# Prérequis : macOS, Xcode 15+, CocoaPods, Apple Developer Account
cd frontend
npm install @capacitor/ios
npx cap add ios
./scripts/build-ios.sh

# Résultat : frontend/ios/build/App.ipa
# Upload App Store : Xcode → Organizer → Distribute App
```

### 🪟 Windows EXE
```bash
# Prérequis : Node.js 20+
npm install -g electron-builder
cd pro-digitalix
npm install --legacy-peer-deps
npx tsc -p electron/tsconfig.json
npx electron-builder --win --x64 --config electron/electron-builder.yml

# Résultats :
# dist-electron/PRO DIGITALIX Setup x.x.x.exe (installateur NSIS)
# dist-electron/PRO DIGITALIX x.x.x.exe       (portable)
```

---

## CHECKLIST LANCEMENT

### ✅ Infrastructure
- [ ] VPS Ubuntu 22.04 LTS provisionné (2+ vCPU, 4+ GB RAM)
- [ ] Docker et Docker Compose V2 installés
- [ ] DNS configuré : `prodigitalix.com` → IP VPS
- [ ] DNS configuré : `api.prodigitalix.com` → IP VPS
- [ ] Port 80, 443, 22 ouverts dans le firewall
- [ ] `ufw` configuré : `ufw allow 22,80,443/tcp && ufw enable`

### ✅ Base de données (Supabase)
- [ ] Projet Supabase créé (région eu-west-3 Paris recommandée)
- [ ] `scripts/supabase-setup.sql` exécuté dans l'éditeur SQL
- [ ] Vérifier : `SELECT role, email FROM users WHERE role = 'owner';`
- [ ] `DATABASE_URL` (pooler) copié dans `backend/.env`
- [ ] `DATABASE_URL_DIRECT` (direct) copié pour les migrations

### ✅ Variables d'environnement
- [ ] `backend/.env` rempli (toutes les variables obligatoires ✅)
- [ ] `frontend/.env.local` rempli
- [ ] `JWT_SECRET` : 64+ caractères aléatoires (`openssl rand -hex 32`)
- [ ] `NEXTAUTH_SECRET` : 32+ caractères (`openssl rand -hex 16`)
- [ ] `ENCRYPTION_KEY` : exactement 32 caractères
- [ ] `CHARIOW_WEBHOOK_SECRET` : copié depuis votre boutique Chariow

### ✅ Authentification OAuth
- [ ] Google Cloud Console → OAuth 2.0 configuré
  - Origines autorisées : `https://prodigitalix.com`
  - Callbacks : `https://prodigitalix.com/api/auth/callback/google`
- [ ] Facebook Developers → App configurée
  - Callback : `https://prodigitalix.com/api/auth/callback/facebook`

### ✅ Firebase (Push Notifications)
- [ ] Projet Firebase créé
- [ ] FCM activé (Firebase Cloud Messaging)
- [ ] Clé de service Admin SDK téléchargée et configurée dans `backend/.env`
- [ ] Clé VAPID générée dans Firebase Console → Cloud Messaging → Web Push certificates
- [ ] Variables `NEXT_PUBLIC_FIREBASE_*` remplies dans `frontend/.env.local`
- [ ] `firebase-messaging-sw.js` mis à jour avec les vraies valeurs Firebase

### ✅ Déploiement
- [ ] Dépôt Git créé et code pushé sur `main`
- [ ] Clés SSH configurées sur le VPS
- [ ] `./scripts/ssl-setup.sh` exécuté → certificats Let's Encrypt générés
- [ ] `./scripts/deploy.sh` exécuté → tous les services démarrés
- [ ] Health check OK : `curl https://api.prodigitalix.com/health`
- [ ] Frontend OK : `curl -I https://prodigitalix.com`

### ✅ CI/CD GitHub Actions
- [ ] Secrets GitHub configurés (VPS_HOST, VPS_USER, VPS_SSH_KEY, etc.)
- [ ] Premier workflow déclenché et réussi
- [ ] Test : push sur `main` → déploiement automatique

### ✅ Webhook Chariow
- [ ] Webhook ajouté dans la boutique Chariow :
  - URL : `https://api.prodigitalix.com/api/v1/subscription/webhook/chariow`
  - Événements : `order.paid`
  - Secret HMAC : identique à `CHARIOW_WEBHOOK_SECRET`
- [ ] Test webhook réussi (Chariow → Envoyer un test)
- [ ] Vérifier dans owner/monitoring → Chariow

### ✅ Monitoring
- [ ] `MONITORING_WEBHOOK_URL` configuré (Slack/Discord)
- [ ] Test alerte : vérifier réception dans Slack
- [ ] Dashboard monitoring accessible : `/owner/monitoring`

### ✅ Applications mobiles
- [ ] APK Debug testé sur téléphone Android réel
- [ ] APK Release signé généré
- [ ] AAB soumis sur Google Play Console
- [ ] IPA testé sur TestFlight
- [ ] IPA soumis sur App Store Connect
- [ ] EXE Windows testé sur machine fraîche

### ✅ PWA
- [ ] Lighthouse Score ≥ 90 sur mobile et desktop
- [ ] Installation PWA testée sur Android (Chrome)
- [ ] Installation PWA testée sur iOS (Safari → Partager → Ajouter)
- [ ] Notifications push reçues sur PWA installée

### ✅ Sécurité finale
- [ ] Test injection SQL : paramètres API validés (Zod)
- [ ] Test CORS : requêtes depuis domaine inconnu rejetées
- [ ] Test rate limiting : 10+ tentatives login → bloqué
- [ ] Test HMAC webhook : signature incorrecte → 401
- [ ] Mot de passe compte OWNER changé via API (hash bcrypt)
- [ ] Headers sécurité vérifiés : `curl -I https://prodigitalix.com`

### ✅ Tests fonctionnels
- [ ] Inscription + vérification email
- [ ] Connexion Google OAuth
- [ ] Connexion Facebook OAuth
- [ ] Connexion manuelle
- [ ] Connexion Chariow + synchronisation données
- [ ] Dashboard affiche les vraies données
- [ ] Rapport PDF généré et téléchargeable
- [ ] Export Excel fonctionnel
- [ ] Assistant IA répond correctement
- [ ] Notification push reçue après une vente test
- [ ] Paiement test via Chariow → Premium activé automatiquement
- [ ] Page maintenance accessible : `/maintenance`
- [ ] Owner dashboard SaaS affiche les stats

### ✅ Communications de lancement
- [ ] Email de bienvenue configuré et testé
- [ ] Page de tarification en ligne et visible
- [ ] Checkout Chariow fonctionnel : `https://anabokgroup.online/prd_y2htjbxf/checkout`
- [ ] Réseaux sociaux : annonce de lancement préparée
- [ ] Guide de démarrage accessible : `/onboarding`

---

## POST-LANCEMENT (J+7)

- [ ] Surveiller les logs : `docker compose logs -f backend`
- [ ] Vérifier les sauvegardes : `/owner/monitoring` → Sauvegardes
- [ ] Analyser les premières inscriptions : `/owner/saas`
- [ ] Répondre aux premiers tickets support : `/support`
- [ ] Ajuster les prix/promos si nécessaire

---

## URLS DE PRODUCTION

| Service | URL |
|---------|-----|
| Application | https://prodigitalix.com |
| API | https://api.prodigitalix.com |
| Health check | https://api.prodigitalix.com/health |
| Webhook Chariow | https://api.prodigitalix.com/api/v1/subscription/webhook/chariow |
| Checkout Premium | https://anabokgroup.online/prd_y2htjbxf/checkout |
| Dashboard OWNER | https://prodigitalix.com/owner/saas |
| Monitoring | https://prodigitalix.com/owner/monitoring |

---

## CONTACTS URGENCE

- **Support technique** : anabokgroup@gmail.com
- **WhatsApp** : +228 79 81 29 99
- **OWNER Login** : anabokgroup@gmail.com

---

*PRO DIGITALIX — Analysez • Optimisez • Développez*
*Développé par ANABOK GROUP*
