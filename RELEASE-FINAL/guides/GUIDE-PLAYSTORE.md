# 📱 Guide Publication Google Play Store
## PRO DIGITALIX — ANABOK GROUP

---

## PRÉREQUIS

- [ ] Compte Google Play Developer (25 USD une seule fois) → https://play.google.com/console
- [ ] AAB signé disponible : `RELEASE/android/PRO-DIGITALIX-v1.0.0-playstore.aab`
- [ ] Captures d'écran (2-8 screenshots, 16:9, min 320px)
- [ ] Icône 512×512 PNG (pas de coins arrondis)
- [ ] Bannière Feature Graphic 1024×500 PNG

---

## ÉTAPES DE PUBLICATION

### 1. Créer l'application sur Play Console

1. Aller sur https://play.google.com/console
2. Cliquer **Créer une application**
3. Remplir :
   - **Nom** : PRO DIGITALIX
   - **Langue par défaut** : Français
   - **Application / Jeu** : Application
   - **Gratuite / Payante** : Gratuite
4. Accepter les politiques → **Créer l'application**

---

### 2. Fiche Play Store (présence en magasin)

**Informations principales :**
```
Nom de l'application : PRO DIGITALIX
Courte description   : Analytics avancée pour vendeurs Chariow
Description complète :
PRO DIGITALIX est la plateforme SaaS d'analytics professionnelle
conçue pour les vendeurs de produits digitaux sur Chariow.

FONCTIONNALITÉS :
✅ Tableau de bord temps réel
✅ CRM Clients complet
✅ Analytics produits & visiteurs  
✅ Détection paniers abandonnés
✅ Rapports PDF & export Excel
✅ Assistant IA GPT-4o
✅ Notifications push
✅ Prévisions de ventes
✅ Intégration Chariow native

Développé par ANABOK GROUP.
```

---

### 3. Ressources graphiques

| Ressource | Dimensions | Format |
|-----------|-----------|--------|
| Icône | 512 × 512 px | PNG (pas d'alpha sur le fond) |
| Feature Graphic | 1024 × 500 px | PNG / JPEG |
| Screenshots téléphone | min 320px côté court | PNG / JPEG (2 à 8) |
| Screenshots tablette | 7" et 10" | PNG / JPEG (optionnel) |

**Couleurs de marque :**
- Fond : `#0A0F1C`
- Principal : `#1A6EFF`
- Dégradé : `#00C8FF → #1A6EFF → #0A1A6E`

---

### 4. Classification du contenu

- **Catégorie** : Applications → Finance / Business
- **Contenu** : Tout public (PEGI 3 / E)
- **Public cible** : Adultes (entrepreneurs, vendeurs)
- Répondre au questionnaire de classification

---

### 5. Tarification & distribution

- **Prix** : Gratuit (monétisation via abonnement in-app)
- **Pays** : Sélectionner Togo + Afrique francophone + International
- **Appareils** : Téléphones et tablettes Android

---

### 6. Uploader l'AAB

1. Releases → Production → Créer une version
2. Uploader `PRO-DIGITALIX-v1.0.0-playstore.aab`
3. Notes de version (fr) :
   ```
   Version 1.0.0 — Lancement officiel
   • Tableau de bord analytics temps réel
   • CRM Clients et gestion commandes
   • Assistant IA intégré
   • Rapports PDF et export Excel
   • Notifications push
   ```
4. Enregistrer → Vérifier → Publier

---

### 7. Délais de review

- **Première publication** : 3 à 7 jours ouvrables
- **Mises à jour** : 1 à 3 jours ouvrables
- **Statut** : Vérifiable dans Play Console → Releases

---

### 8. Optimisation ASO (App Store Optimization)

**Mots-clés à inclure dans la description :**
- analytics chariow
- tableau de bord vendeur
- statistiques ventes Togo
- CRM client Africa
- rapport ventes digital

---

## COMMANDE DE BUILD RAPIDE

```bash
export KEYSTORE_PASSWORD="votre_mot_de_passe"
export KEY_PASSWORD="votre_mot_de_passe_cle"
bash RELEASE/android/BUILD-ANDROID.sh
```

**Résultats :**
- `RELEASE/android/PRO-DIGITALIX-v1.0.0-release.apk` → Distribution directe
- `RELEASE/android/PRO-DIGITALIX-v1.0.0-playstore.aab` → Google Play

---

*PRO DIGITALIX — Analysez • Optimisez • Développez*
*ANABOK GROUP*
