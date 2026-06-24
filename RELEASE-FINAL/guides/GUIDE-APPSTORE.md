# 🍎 Guide Publication App Store (iOS)
## PRO DIGITALIX — ANABOK GROUP

---

## PRÉREQUIS

- [ ] Mac avec macOS 13+ et Xcode 15+
- [ ] Compte Apple Developer (99 USD/an) → https://developer.apple.com/account
- [ ] App créée sur App Store Connect → https://appstoreconnect.apple.com
- [ ] Certificat "Apple Distribution" installé dans Xcode Keychain
- [ ] CocoaPods : `sudo gem install cocoapods`

---

## CONFIGURATION XCODE

### Bundle ID
```
com.anabokgroup.prodigitalix
```

### Info.plist — Permissions requises
```xml
<key>NSCameraUsageDescription</key>
<string>PRO DIGITALIX utilise la caméra pour scanner des QR codes</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Accès photos pour partager vos rapports</string>

<key>NSUserNotificationsUsageDescription</key>
<string>PRO DIGITALIX vous notifie de vos nouvelles ventes</string>
```

---

## ÉTAPES DE PUBLICATION

### 1. Créer l'App sur App Store Connect

1. https://appstoreconnect.apple.com → **Mes apps → +**
2. Remplir :
   - **Plateforme** : iOS
   - **Nom** : PRO DIGITALIX
   - **Langue principale** : Français
   - **Bundle ID** : com.anabokgroup.prodigitalix
   - **SKU** : PRODIGITALIX001

---

### 2. Informations App Store

**Nom** : PRO DIGITALIX

**Sous-titre** : Analytics pour vendeurs Chariow

**Description** :
```
PRO DIGITALIX est la plateforme SaaS d'analytics professionnelle 
pour les vendeurs de produits digitaux sur Chariow.

FONCTIONNALITÉS PREMIUM :
• Tableau de bord temps réel
• CRM Clients avancé
• Analytics produits & visiteurs
• Détection paniers abandonnés
• Rapports PDF professionnels
• Export Excel des données
• Assistant IA GPT-4o
• Notifications push instantanées
• Prévisions de ventes IA
• Intégration Chariow native

Abonnement Premium : 10 000 FCFA/an
Activation automatique après paiement.

Développé par ANABOK GROUP — Lomé, Togo.
```

**Mots-clés** (100 caractères max) :
```
analytics,chariow,ventes,CRM,dashboard,rapport,statistiques,boutique,digital,Togo
```

**URL de l'app** : https://prodigitalix.com

**URL du support** : https://prodigitalix.com/support

**URL de la politique de confidentialité** : https://prodigitalix.com/privacy

---

### 3. Ressources graphiques iOS

| Ressource | Dimensions |
|-----------|-----------|
| Icône app | 1024 × 1024 px (PNG, sans transparence) |
| iPhone 6.7" screenshots | 1290 × 2796 px (min 3, max 10) |
| iPhone 6.5" screenshots | 1242 × 2688 px |
| iPad Pro 12.9" screenshots | 2048 × 2732 px (optionnel) |

---

### 4. Tarification

- **Prix de base** : Gratuit
- **Achats In-App** (optionnel à configurer plus tard) :
  - Abonnement annuel Premium : 10 000 FCFA (~15 USD)
  - ID produit : `com.anabokgroup.prodigitalix.premium.annual`

---

### 5. Upload IPA

**Option A — via Xcode :**
```
Xcode → Window → Organizer → Distribute App → App Store Connect
```

**Option B — via ligne de commande :**
```bash
xcrun altool --upload-app \
  -f RELEASE/ios/PRO-DIGITALIX-v1.0.0.ipa \
  -u anabokgroup@gmail.com \
  -p "@keychain:AC_PASSWORD" \
  --type ios
```

**Option C — via Transporter (app Mac gratuite)**

---

### 6. TestFlight (test avant publication)

1. App Store Connect → TestFlight
2. Sélectionner la build uploadée
3. Ajouter testeurs internes (jusqu'à 25)
4. Distribuer aux testeurs externes (jusqu'à 10 000)
5. Attendre la review TestFlight (24-48h)

---

### 7. Soumettre pour Review

1. App Store Connect → App Store → Version 1.0.0
2. Compléter toutes les sections (obligatoire)
3. Cliquer **Soumettre pour review**
4. **Délai :** 24 à 72 heures (première soumission 3-5 jours)

---

## COMMANDE DE BUILD

```bash
# Sur macOS uniquement
export APPLE_TEAM_ID="VOTRE_TEAM_ID"
bash RELEASE/ios/BUILD-IOS.sh
```

---

*PRO DIGITALIX — Analysez • Optimisez • Développez*
*ANABOK GROUP*
