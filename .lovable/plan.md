
# Flow de reservation One Shot

## Objectif
Permettre a un visiteur de payer 179EUR via Stripe puis d'etre redirige vers une page de confirmation avec le lien Calendly pour reserver son creneau.

## Architecture

Le flow sera :
1. Page One Shot (existante) -- clic sur "Reserver"
2. Redirection vers Stripe Checkout (paiement 179EUR)
3. Retour sur une page de succes avec le lien Calendly + message de contact

Pas besoin d'authentification : le paiement est ouvert a tous (checkout invite).

## Etapes d'implementation

### 1. Creer la fonction backend `create-oneshot-checkout`
- Cree une session Stripe Checkout en mode `payment` avec le prix One Shot (`price_1SHp2SBfuzQl0PTiBCmEAq2l` = 179EUR)
- Pas d'authentification requise (checkout invite, Stripe collecte l'email)
- URL de succes : `/one-shot/success`
- URL d'annulation : `/one-shot`

### 2. Creer la page de succes `/one-shot/success`
- Message de confirmation du paiement
- Bouton principal vers le Calendly : `https://calendly.com/fredwavcm/accompagnement-one-shot`
- Mention : "Si les horaires proposes ne sont pas possibles pour vous, merci de me contacter a fredwavcm@gmail.com"
- Lien de retour vers l'accueil

### 3. Mettre a jour la page One Shot
- Les boutons "Reserver" appellent la fonction backend pour creer la session Stripe
- Redirection automatique vers la page de paiement Stripe

### 4. Ajouter la route dans App.tsx
- `/one-shot/success` pointe vers la nouvelle page de succes

## Details techniques

- Fonction backend : `supabase/functions/create-oneshot-checkout/index.ts`
- Utilise le prix Stripe existant `price_1SHp2SBfuzQl0PTiBCmEAq2l` (179EUR, one-time)
- Mode guest : pas de verification d'authentification, Stripe collecte l'email du client
- Nouvelle page : `src/pages/OneShotSuccess.tsx`
- Nouvelle route : `/one-shot/success` dans `App.tsx`
