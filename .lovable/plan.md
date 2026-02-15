

# VIP : page de succes apres paiement

## Constat

Le flow VIP est deja en grande partie implemente :
- Page de checkout avec selection du plan (3/6/12 mois) et saisie de l'ID Discord
- Fonction backend pour creer la session Stripe
- Webhook Stripe pour creer l'abonnement VIP et attribuer le role Discord
- Fonctions d'attribution/revocation du role Discord
- Verification automatique des expirations

**Ce qui manque** : apres le paiement, l'utilisateur est redirige vers `/offres/vip?success=true`, mais la page ne gere pas ce parametre. Il faut afficher un message de confirmation avec le lien vers le serveur Discord.

## Ce qui sera fait

### 1. Gerer le retour apres paiement sur VipCheckout

Detecter les query params `success=true` et `cancelled=true` dans l'URL :
- **Succes** : afficher un ecran de confirmation avec :
  - Message de bienvenue dans le club VIP
  - Bouton principal vers le serveur Discord (lien d'invitation a fournir)
  - Mention que le role VIP a ete attribue automatiquement
  - Lien de retour vers l'accueil
- **Annulation** : afficher un toast informant que le paiement a ete annule

### 2. Clarification necessaire

Il me faudra le **lien d'invitation Discord** vers ton serveur (ex: `https://discord.gg/xxx`) pour le bouton de la page de succes.

## Details techniques

- Fichier modifie : `src/pages/VipCheckout.tsx`
- Utilisation de `useSearchParams` de react-router-dom pour detecter `success` et `cancelled`
- Affichage conditionnel : si `success=true`, on montre l'ecran de confirmation au lieu du formulaire de checkout
- Pas de nouvelle route ni de nouveau fichier necessaire
