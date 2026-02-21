

# Simplifier le checkout VIP : supprimer le champ Discord ID

## Probleme

Le lien Discord `https://discord.gg/KUgFunVhKY` octroie deja automatiquement le bon role VIP. Demander l'ID Discord en plus ajoute de la friction inutile et complique le parcours d'achat.

## Ce qui va changer

### 1. Page de checkout (`VipCheckout.tsx`)

- Supprimer le champ "Ton ID Discord" (tout le bloc avec l'input, le label et les instructions)
- Supprimer la validation qui bloque le paiement si l'ID Discord n'est pas rempli
- Supprimer les imports inutiles (`Input`, `Label`, `MessageCircle`, `Info`)
- Supprimer le state `discordId`
- Ne plus envoyer `discordUserId` dans l'appel a `create-vip-checkout`

### 2. Page de succes (deja en place)

- Mettre a jour le texte : au lieu de "Ton role VIP a ete attribue automatiquement", indiquer de rejoindre le serveur Discord via le lien pour obtenir le role
- Le bouton "Rejoindre le serveur Discord" reste en place

### 3. Fonction `create-vip-checkout`

- Retirer `discordUserId` des champs requis et des metadata Stripe
- Simplifier la validation

### 4. Fonction `stripe-webhook`

- Retirer la logique d'attribution de role Discord via le bot (appel a `discord-role`)
- Ne plus stocker `discord_user_id` ni `discord_role_granted` dans la table `vip_subscriptions`

## Details techniques

- Fichiers modifies :
  - `src/pages/VipCheckout.tsx` (suppression champ + simplification)
  - `supabase/functions/create-vip-checkout/index.ts` (retrait discordUserId)
  - `supabase/functions/stripe-webhook/index.ts` (retrait logique bot Discord)
- Aucun fichier cree ou supprime
- Les fonctions `discord-role` et `check-vip-expiry` restent disponibles si besoin futur

