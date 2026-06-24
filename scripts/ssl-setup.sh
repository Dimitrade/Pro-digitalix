#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# PRO DIGITALIX — Configuration SSL Let's Encrypt
# ═══════════════════════════════════════════════════════════════════

DOMAIN="prodigitalix.com"
EMAIL="anabokgroup@gmail.com"

set -euo pipefail
echo "🔒 Configuration SSL pour $DOMAIN..."

# 1. Démarrer Nginx en mode HTTP seulement (pour la validation ACME)
docker compose -f docker-compose.prod.yml up -d nginx

# 2. Obtenir le certificat
docker run --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "api.$DOMAIN"

echo "✅ Certificats SSL générés pour $DOMAIN"

# 3. Recharger Nginx avec SSL
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
echo "✅ Nginx rechargé avec SSL"

# 4. Test renouvellement
docker run --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot renew --dry-run

echo "✅ Configuration SSL complète !"
echo "🌍 https://$DOMAIN"
echo "🔌 https://api.$DOMAIN/health"
