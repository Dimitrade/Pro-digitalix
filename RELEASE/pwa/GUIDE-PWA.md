# 🌐 Guide PWA — Progressive Web App
## PRO DIGITALIX — ANABOK GROUP

---

## QU'EST-CE QUE LA PWA ?

La PWA PRO DIGITALIX fonctionne comme une app native installable depuis le navigateur :
- ✅ Installable sur Android, iOS, Windows, macOS
- ✅ Fonctionne hors ligne (cache service worker)
- ✅ Notifications push
- ✅ Icône sur l'écran d'accueil
- ✅ Plein écran (pas de barre de navigateur)
- ✅ Mises à jour automatiques

---

## CRITÈRES LIGHTHOUSE PWA

Pour obtenir le badge "Installable", l'app doit satisfaire :

| Critère | Statut |
|---------|--------|
| HTTPS requis | ✅ (nginx SSL configuré) |
| manifest.json valide | ✅ (`/public/manifest.json`) |
| Service Worker actif | ✅ (`/public/firebase-messaging-sw.js`) |
| Icônes 192px et 512px | ✅ (`icon-192.svg`, `icon-512.svg`) |
| start_url accessible | ✅ |
| display: standalone | ✅ |

---

## VÉRIFICATION LIGHTHOUSE

```bash
# Installer Lighthouse CLI
npm install -g lighthouse

# Audit PWA
lighthouse https://prodigitalix.com \
  --only-categories=pwa \
  --output=html \
  --output-path=RELEASE/pwa/audit-pwa.html

# Ouvrir le rapport
open RELEASE/pwa/audit-pwa.html
```

**Score cible : ≥ 90/100**

---

## INSTALLATION PAR PLATEFORME

### Android (Chrome)
1. Ouvrir https://prodigitalix.com dans Chrome
2. Appuyer sur le menu `⋮` → "Ajouter à l'écran d'accueil"
3. Ou : bannière automatique apparaît après 2 visites

### iOS (Safari)
1. Ouvrir https://prodigitalix.com dans Safari
2. Appuyer sur l'icône Partager `□↑`
3. "Sur l'écran d'accueil" → Ajouter

### Windows (Edge/Chrome)
1. Ouvrir https://prodigitalix.com
2. Icône d'installation dans la barre d'adresse `⊕`
3. Cliquer "Installer"

### macOS (Chrome/Edge)
1. Ouvrir https://prodigitalix.com
2. Chrome → Menu `⋮` → "Installer PRO DIGITALIX"

---

## MANIFEST.JSON (déjà configuré)

```json
{
  "name": "PRO DIGITALIX",
  "short_name": "PRO DIGITALIX",
  "description": "Analytics SaaS pour vendeurs Chariow",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0A0F1C",
  "theme_color": "#1A6EFF",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icon-192.svg", "sizes": "192x192", "type": "image/svg+xml" },
    { "src": "/icon-512.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "maskable any" }
  ],
  "shortcuts": [
    { "name": "Dashboard", "url": "/dashboard" },
    { "name": "Rapports", "url": "/reports" },
    { "name": "Assistant IA", "url": "/ai" }
  ]
}
```

---

## SERVICE WORKER — Cache Strategy

Le fichier `firebase-messaging-sw.js` gère :
- Messages FCM en arrière-plan
- Navigation vers l'app au clic sur notification

Pour un service worker de cache offline complet, Next.js utilise son propre système de cache via `next/cache`.

---

## CHECKLIST AVANT LANCEMENT PWA

- [ ] https://prodigitalix.com accessible
- [ ] https://prodigitalix.com/manifest.json retourne 200
- [ ] https://prodigitalix.com/icon-192.svg retourne 200
- [ ] https://prodigitalix.com/icon-512.svg retourne 200
- [ ] https://prodigitalix.com/firebase-messaging-sw.js retourne 200
- [ ] DevTools → Application → Manifest → "Installable" ✅
- [ ] DevTools → Application → Service Workers → Status: Activated ✅
- [ ] Lighthouse PWA Score ≥ 90

---

## SOUMISSION PWA STORES

### Microsoft Store (Windows 11)
- Outil gratuit PWABuilder → https://www.pwabuilder.com/
- Entrer l'URL : `https://prodigitalix.com`
- Générer le package MSIX automatiquement
- Soumettre sur Microsoft Partner Center

### Google Play (Android TWA)
- PWABuilder génère un APK TWA (Trusted Web Activity)
- Alternative à Capacitor pour la distribution Play Store

---

*PRO DIGITALIX — Analysez • Optimisez • Développez*
*ANABOK GROUP*
