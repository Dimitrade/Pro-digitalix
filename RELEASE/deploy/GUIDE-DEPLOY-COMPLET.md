# 🚀 Guide Déploiement Production Complet
## PRO DIGITALIX — ANABOK GROUP

---

## ÉTAPE 1 — PRÉPARER LE SERVEUR VPS

### Commandes à exécuter sur votre VPS Ubuntu 22.04

```bash
# Connexion SSH
ssh root@VOTRE_IP_VPS

# Mise à jour système
apt update && apt upgrade -y

# Installation Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# Docker Compose V2
apt install docker-compose-plugin -y

# Git
apt install git -y

# Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Cloner le projet
mkdir -p /opt/prodigitalix
cd /opt/prodigitalix
git clone https://github.com/VOTRE_USER/prodigitalix.git .
```

---

## ÉTAPE 2 — CONFIGURER SUPABASE

### 2.1 Créer le projet Supabase

1. Aller sur https://supabase.com → New Project
2. Choisir la région **eu-west-3 (Paris)** pour la latence Afrique de l'Ouest
3. Définir un mot de passe fort pour la DB
4. Copier la **Connection String** (pooler mode) :
   ```
   postgresql://postgres.[ref]:[password]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### 2.2 Exécuter le schéma SQL

1. Supabase → SQL Editor → New Query
2. Copier/coller le contenu de : `scripts/supabase-setup.sql`
3. Cliquer **Run**
4. Vérifier : `SELECT role, email FROM users WHERE role = 'owner';`
5. Résultat attendu : `owner | anabokgroup@gmail.com`

---

## ÉTAPE 3 — CONFIGURER LES VARIABLES D'ENVIRONNEMENT

### Backend (`/opt/prodigitalix/backend/.env`)

```bash
nano /opt/prodigitalix/backend/.env
```

```env
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://prodigitalix.com

# OBLIGATOIRE — Supabase pooler URL
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true

# OBLIGATOIRE — Générer : openssl rand -hex 32
JWT_SECRET=CHANGEZ_MOI_64_CARACTERES_MINIMUM_ALEATOIRES_OBLIGATOIRE

# OBLIGATOIRE
JWT_EXPIRES_IN=7d
CHARIOW_WEBHOOK_SECRET=VOTRE_SECRET_WEBHOOK_CHARIOW
ENCRYPTION_KEY=EXACTEMENT_32_CARACTERES_ICI__

# OAuth (si activé)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# OpenAI (assistant IA)
OPENAI_API_KEY=sk-...

# Firebase (notifications push)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@votre-projet.iam.gserviceaccount.com

# Monitoring alertes
MONITORING_WEBHOOK_URL=https://hooks.slack.com/services/...

# Sauvegardes
BACKUP_DIR=/opt/backups/prodigitalix
```

### Frontend (`/opt/prodigitalix/frontend/.env.local`)

```bash
nano /opt/prodigitalix/frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=https://api.prodigitalix.com/api/v1
NEXTAUTH_URL=https://prodigitalix.com

# Générer : openssl rand -hex 16
NEXTAUTH_SECRET=CHANGEZ_MOI_32_CARACTERES_MINIMUM

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# Firebase web
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

---

## ÉTAPE 4 — CONFIGURER LE DNS

Dans votre gestionnaire DNS (Namecheap, OVH, Cloudflare, etc.) :

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| A | @ | VOTRE_IP_VPS | 3600 |
| A | www | VOTRE_IP_VPS | 3600 |
| A | api | VOTRE_IP_VPS | 3600 |

⚠️ Attendre la propagation DNS (5 min à 48h selon le registrar).

Vérifier : `nslookup prodigitalix.com`

---

## ÉTAPE 5 — CERTIFICATS SSL

```bash
cd /opt/prodigitalix
chmod +x scripts/ssl-setup.sh
./scripts/ssl-setup.sh
```

Ce script :
1. Lance Nginx en mode HTTP (pour validation ACME)
2. Génère les certificats Let's Encrypt pour `prodigitalix.com`, `www.prodigitalix.com`, `api.prodigitalix.com`
3. Recharge Nginx avec HTTPS

**Renouvellement automatique** (via Watchtower/cron déjà configuré dans docker-compose.prod.yml).

---

## ÉTAPE 6 — PREMIER DÉPLOIEMENT

```bash
cd /opt/prodigitalix
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Ce script :
1. Vérifie les prérequis
2. Sauvegarde la DB (si existe)
3. Build les images Docker
4. Démarre tous les services
5. Applique les migrations SQL
6. Vérifie le health check

---

## ÉTAPE 7 — VÉRIFICATIONS POST-DÉPLOIEMENT

```bash
# API Backend
curl https://api.prodigitalix.com/health
# Attendu : {"status":"ok","timestamp":"...","version":"1.0.0"}

# Frontend
curl -I https://prodigitalix.com
# Attendu : HTTP/2 200

# Connexion DB (via backend)
docker compose -f docker-compose.prod.yml exec backend sh -c \
  'psql $DATABASE_URL -c "SELECT role, email FROM users WHERE role = '"'"'owner'"'"';"'
```

---

## ÉTAPE 8 — CONFIGURER LE WEBHOOK CHARIOW

1. Ouvrir votre boutique Chariow → Paramètres → Webhooks
2. Ajouter un nouveau webhook :
   - **URL** : `https://api.prodigitalix.com/api/v1/subscription/webhook/chariow`
   - **Événements** : `order.paid` (ou `payment.success`)
   - **Secret** : valeur de `CHARIOW_WEBHOOK_SECRET` dans votre `.env`
3. Enregistrer et tester

Vérifier dans PRO DIGITALIX → `/owner/monitoring` → onglet Chariow.

---

## ÉTAPE 9 — COMPTE OWNER

Le compte OWNER (anabokgroup@gmail.com) est créé automatiquement lors du setup SQL.

**Définir le mot de passe via l'API :**
```bash
curl -X POST https://api.prodigitalix.com/api/v1/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"email":"anabokgroup@gmail.com","password":"VOTRE_MOT_DE_PASSE_FORT"}'
```

Ou via la connexion email/mot de passe sur https://prodigitalix.com/login.

---

## ÉTAPE 10 — CI/CD GITHUB ACTIONS

Secrets à configurer dans GitHub → Settings → Secrets → Actions :

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | IP de votre VPS |
| `VPS_USER` | `root` ou utilisateur sudo |
| `VPS_SSH_KEY` | Clé SSH privée (`cat ~/.ssh/id_rsa`) |
| `NEXT_PUBLIC_API_URL` | `https://api.prodigitalix.com/api/v1` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Clé Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID projet Firebase |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | VAPID Key |
| `SLACK_WEBHOOK` | Webhook Slack (alertes) |

Après configuration : chaque `git push origin main` déclenche automatiquement le déploiement.

---

## PROCÉDURE DE MISE À JOUR

### Mise à jour manuelle (hotfix)
```bash
ssh root@VOTRE_IP_VPS
cd /opt/prodigitalix
git pull origin main
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Mise à jour automatique (CI/CD)
```bash
# En local
git add .
git commit -m "fix: correction bug XYZ"
git push origin main
# → GitHub Actions déploie automatiquement
```

### Rollback d'urgence
```bash
git log --oneline -5  # Identifier le commit précédent
git checkout <commit_précédent>
docker compose -f docker-compose.prod.yml up -d --build
```

---

## LOGS ET MONITORING

```bash
# Tous les logs
docker compose -f docker-compose.prod.yml logs -f

# Logs API seulement
docker compose -f docker-compose.prod.yml logs -f backend

# Logs Nginx
docker compose -f docker-compose.prod.yml logs -f nginx

# Utilisation ressources
docker stats
```

---

## URLS DE PRODUCTION

| Service | URL |
|---------|-----|
| Application | https://prodigitalix.com |
| API | https://api.prodigitalix.com |
| Health | https://api.prodigitalix.com/health |
| Webhook | https://api.prodigitalix.com/api/v1/subscription/webhook/chariow |
| Dashboard OWNER | https://prodigitalix.com/owner/saas |
| Monitoring | https://prodigitalix.com/owner/monitoring |
| Pricing | https://prodigitalix.com/pricing |
| Checkout | https://anabokgroup.online/prd_y2htjbxf/checkout |

---

*PRO DIGITALIX — Analysez • Optimisez • Développez*
*Développé par ANABOK GROUP*
