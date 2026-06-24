#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# PRO DIGITALIX — Script de déploiement production
# ANABOK GROUP
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

log "🚀 Déploiement PRO DIGITALIX — $(date)"

# ── 1. Vérifications prérequis ───────────────────────────────────────────────
log "Vérification des prérequis..."
command -v docker   >/dev/null || fail "Docker non installé"
command -v git      >/dev/null || fail "Git non installé"
[[ -f ".env.production" ]] && warn ".env.production trouvé à la racine" || true

# ── 2. Pull dernière version ─────────────────────────────────────────────────
log "Récupération du code source..."
git pull origin main || fail "Impossible de pull depuis Git"
ok "Code source à jour"

# ── 3. Sauvegarde avant déploiement ─────────────────────────────────────────
log "Sauvegarde de la base de données..."
if command -v pg_dump >/dev/null 2>&1; then
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  mkdir -p /opt/backups/prodigitalix
  pg_dump "$DATABASE_URL" | gzip > "/opt/backups/prodigitalix/pre-deploy-${TIMESTAMP}.sql.gz" && \
    ok "Sauvegarde créée : pre-deploy-${TIMESTAMP}.sql.gz" || \
    warn "Impossible de sauvegarder (pg_dump non disponible)"
fi

# ── 4. Build et démarrage ─────────────────────────────────────────────────────
log "Build des images Docker..."
docker compose -f docker-compose.prod.yml build --no-cache || fail "Erreur build Docker"
ok "Images Docker construites"

log "Démarrage des services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans
ok "Services démarrés"

# ── 5. Migrations base de données ────────────────────────────────────────────
log "Application des migrations..."
sleep 10
for f in database/migrations/*.sql; do
  log "Migration : $f"
  docker exec prodigitalix-api sh -c "psql \$DATABASE_URL < /dev/stdin" < "$f" && \
    ok "$(basename $f)" || warn "Migration déjà appliquée ou erreur : $(basename $f)"
done

# ── 6. Health check ──────────────────────────────────────────────────────────
log "Vérification santé..."
sleep 15
MAX_RETRIES=5; i=0
until curl -sf http://localhost:4000/health >/dev/null 2>&1; do
  i=$((i+1)); [[ $i -ge $MAX_RETRIES ]] && fail "API ne répond pas après ${MAX_RETRIES} tentatives"
  warn "En attente... ($i/$MAX_RETRIES)"; sleep 5
done
ok "API opérationnelle"

# ── 7. Nettoyage ─────────────────────────────────────────────────────────────
log "Nettoyage Docker..."
docker system prune -f --volumes=false
ok "Nettoyage terminé"

# ── 8. Résumé ────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ PRO DIGITALIX déployé avec succès !       ${NC}"
echo -e "${GREEN}  🌍 https://prodigitalix.com                  ${NC}"
echo -e "${GREEN}  🔌 https://api.prodigitalix.com/health       ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
