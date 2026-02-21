
# Ajouter la mention Klarna (3x) et PayPal (4x) sur toutes les pages d'offres

## Objectif

Informer les clients qu'ils peuvent payer en 3 fois avec Klarna et en 4 fois avec PayPal, sous reserve d'acceptation, sur toutes les pages ou un bouton de paiement est present.

## Pages concernees

### 1. One Shot (`src/pages/OneShot.tsx`)
- Sous le bouton CTA hero (ligne 116) : ajouter une mention sous le texte "Creneaux disponibles cette semaine"
- Sous le bouton CTA final (ligne 303) : ajouter la meme mention

### 2. VIP Checkout (`src/pages/VipCheckout.tsx`)
- Sous le bouton "Payer X€" (ligne 144) : remplacer ou completer le texte existant "Paiement securise via Stripe..."

### 3. Page Offres (`src/pages/Offres.tsx`)
- Sous chaque bouton CTA des 3 offres : ajouter la mention en petit texte

## Texte a ajouter

Le texte sera un paragraphe discret en dessous des boutons de paiement :

> Paiement en 3x avec Klarna et 4x avec PayPal disponible, sous reserve d'acceptation.

Style : `text-xs text-muted-foreground text-center mt-2`

## Details techniques

- Fichiers modifies :
  - `src/pages/OneShot.tsx` (2 ajouts sous les 2 boutons CTA)
  - `src/pages/VipCheckout.tsx` (mise a jour du texte sous le bouton de paiement)
  - `src/pages/Offres.tsx` (ajout sous chaque bouton CTA d'offre)
- Aucun fichier cree ou supprime
- Texte identique partout pour la coherence
