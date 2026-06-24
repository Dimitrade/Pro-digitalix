#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# PRO DIGITALIX — Build Windows EXE (Electron)
# Prérequis : Node.js 20, electron-builder
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail
cd "$(dirname "$0")/.."

echo "🪟 Build Windows PRO DIGITALIX..."

# 1. Installer dépendances Electron
echo "→ Installation dépendances Electron..."
npm install --legacy-peer-deps

# 2. Compiler TypeScript Electron
echo "→ Compilation TypeScript Electron..."
npx tsc -p electron/tsconfig.json

# 3. Build l'installateur Windows
echo "→ Build installateur NSIS (EXE)..."
npx electron-builder --win --x64 --config electron/electron-builder.yml

echo ""
echo "✅ Build Windows terminé !"
echo "   Installateur : dist-electron/PRO DIGITALIX Setup x.x.x.exe"
echo "   Portable     : dist-electron/PRO DIGITALIX x.x.x.exe"
