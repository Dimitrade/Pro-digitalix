# 🪟 Guide Build & Distribution Windows
## PRO DIGITALIX — ANABOK GROUP

---

## PRÉREQUIS

- [ ] Node.js 20+ → https://nodejs.org/en/download
- [ ] npm install -g electron-builder
- [ ] (Optionnel) Code signing certificate pour Windows SmartScreen

---

## LANCER LE BUILD

### Option 1 — Double-clic (recommandé)
```
Double-cliquer sur : RELEASE/windows/BUILD-WINDOWS.bat
```

### Option 2 — Ligne de commande
```bash
cd pro-digitalix
npm install --legacy-peer-deps
npx tsc -p electron/tsconfig.json
electron-builder --win --x64 --config electron/electron-builder.yml
```

---

## FICHIERS PRODUITS

| Fichier | Type | Usage |
|---------|------|-------|
| `PRO DIGITALIX Setup 1.0.0.exe` | Installateur NSIS | Distribution classique |
| `PRO DIGITALIX 1.0.0.exe` | Portable | Sans installation |

**Emplacement :** `pro-digitalix/dist-electron/` (puis copié dans `RELEASE/windows/`)

---

## CONTENU DE L'INSTALLATEUR NSIS

L'installateur NSIS créé par electron-builder :
- Installe PRO DIGITALIX dans `C:\Program Files\PRO DIGITALIX\`
- Crée un raccourci Bureau et Menu Démarrer
- Ajoute une entrée "Désinstaller" dans Programmes et fonctionnalités
- Peut mettre à jour automatiquement via GitHub Releases

---

## DISTRIBUTION WINDOWS

### Option A — Distribution directe (EXE)
Partagez `PRO-DIGITALIX-Setup.exe` directement avec vos utilisateurs.

⚠️ **Windows SmartScreen** peut afficher un avertissement car l'EXE n'est pas signé numériquement. Les utilisateurs doivent cliquer "Informations complémentaires → Exécuter quand même".

### Option B — Code Signing (recommandé pour la production)
Obtenir un certificat EV Code Signing (~300 USD/an) :
- DigiCert : https://www.digicert.com/code-signing/
- Sectigo : https://sectigo.com/ssl-certificates-tls/code-signing

Signer l'EXE :
```bash
signtool sign /fd sha256 /a /tr http://timestamp.digicert.com \
  "dist-electron/PRO DIGITALIX Setup 1.0.0.exe"
```

### Option C — Microsoft Store (MSIX)
```bash
electron-builder --win --x64 --target appx --config electron/electron-builder.yml
```
Puis soumettre sur https://partner.microsoft.com/

---

## MISE À JOUR AUTOMATIQUE

L'app Electron est configurée pour les mises à jour auto via GitHub Releases.

1. Créer un Release GitHub : `git tag v1.0.1 && git push --tags`
2. Dans GitHub → Releases → Draft new release → Uploader les EXE
3. Les utilisateurs reçoivent la mise à jour automatiquement au démarrage

---

## RÉSOLUTION DE PROBLÈMES

| Problème | Solution |
|---------|---------|
| `electron-builder: command not found` | `npm install -g electron-builder` |
| `Cannot find module '@capacitor/cli'` | Normal — Capacitor n'est pas utilisé pour Electron |
| SmartScreen bloque | Cliquer "Informations complémentaires → Exécuter" |
| App ne démarre pas | Vérifier `ELECTRON_URL` dans les env vars |

---

*PRO DIGITALIX — Analysez • Optimisez • Développez*
*ANABOK GROUP*
