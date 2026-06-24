#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#  PRO DIGITALIX — Setup VPS Ubuntu 22.04 (tout-en-un)
#  Exécuter en tant que root sur un serveur neuf
#
#  USAGE :
#  curl -fsSL https://raw.githubusercontent.com/VOTRE_REPO/main/RELEASE/deploy/SETUP-VPS-RAPIDE.sh | bash
#
#  OU manuellement :
#  bash SETUP-VPS-RAPIDE.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    PRO DIGITALIX — Setup VPS Ubuntu 22.04       ║${NC}"
echo -e "${BLUE}║    ANABOK GROUP                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

[[ $EUID -ne 0 ]] && fail "Ce script doit être exécuté en tant que root"

# ── 1. Mise à jour système ────────────────────────────────────────────────────
log "Mise à jour du système..."
apt update -qq && apt upgrade -y -qq
ok "Système mis à jour"

# ── 2. Paquets essentiels ─────────────────────────────────────────────────────
log "Installation des paquets essentiels..."
apt install -y -qq git curl wget unzip htop ncdu ufw fail2ban
ok "Paquets installés"

# ── 3. Docker ─────────────────────────────────────────────────────────────────
log "Installation Docker..."
if command -v docker &>/dev/null; then
  warn "Docker déjà installé ($(docker --version))"
else
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker && systemctl start docker
  ok "Docker installé"
fi

# ── 4. Docker Compose V2 ──────────────────────────────────────────────────────
log "Installation Docker Compose V2..."
apt install -y -qq docker-compose-plugin 2>/dev/null || \
  curl -SL "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" \
    -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose
ok "Docker Compose V2 installé"

# ── 5. Firewall UFW ──────────────────────────────────────────────────────────
log "Configuration du firewall UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
ok "Firewall configuré (ports 22/80/443)"

# ── 6. Fail2ban (anti-brute force) ───────────────────────────────────────────
log "Configuration Fail2ban..."
systemctl enable fail2ban && systemctl start fail2ban
ok "Fail2ban actif"

# ── 7. Dossiers projet ────────────────────────────────────────────────────────
log "Préparation des dossiers..."
mkdir -p /opt/prodigitalix
mkdir -p /opt/backups/prodigitalix
mkdir -p /opt/prodigitalix/certbot/conf
mkdir -p /opt/prodigitalix/certbot/www
ok "Dossiers créés"

# ── 8. Swap (si RAM < 4GB) ────────────────────────────────────────────────────
RAM_GB=$(free -g | awk '/^Mem:/{print $2}')
if [[ $RAM_GB -lt 4 ]]; then
  log "RAM insuffisante (${RAM_GB}GB) — Création d'un swap 4GB..."
  [[ -f /swapfile ]] || fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ok "Swap 4GB créé et activé"
fi

# ── 9. Optimisations système ──────────────────────────────────────────────────
log "Optimisations kernel..."
cat >> /etc/sysctl.conf << 'EOF'
# PRO DIGITALIX optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.core.netdev_max_backlog = 65535
EOF
sysctl -p >/dev/null 2>&1
ok "Optimisations appliquées"

# ── 10. Résumé ────────────────────────────────────────────────────────────────
IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ VPS configuré pour PRO DIGITALIX !               ${NC}"
echo -e "${GREEN}                                                      ${NC}"
echo -e "${GREEN}  IP serveur    : $IP                   ${NC}"
echo -e "${GREEN}  Docker        : $(docker --version | cut -d' ' -f3 | tr -d ',')${NC}"
echo -e "${GREEN}  Firewall      : UFW actif (22/80/443)               ${NC}"
echo -e "${GREEN}  Dossier       : /opt/prodigitalix                   ${NC}"
echo -e "${GREEN}  Sauvegardes   : /opt/backups/prodigitalix           ${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
echo ""
echo "PROCHAINES ÉTAPES :"
echo "  1. cd /opt/prodigitalix && git clone VOTRE_REPO ."
echo "  2. Remplir backend/.env et frontend/.env.local"
echo "  3. Configurer DNS : $IP → prodigitalix.com"
echo "  4. bash scripts/ssl-setup.sh"
echo "  5. bash scripts/deploy.sh"
echo ""
