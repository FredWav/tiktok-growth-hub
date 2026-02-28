

## Plan : Passer Stripe en mode test

Le système supporte déjà le basculement test/live. Deux modifications :

### 1. Frontend : `VITE_STRIPE_MODE`
Ajouter `VITE_STRIPE_MODE="test"` dans le fichier `.env` pour que le frontend utilise les Price IDs de test.

### 2. Backend : secret `STRIPE_MODE`
Le secret `STRIPE_MODE` existe déjà. Il faut s'assurer qu'il est bien réglé sur `"test"` pour que les edge functions utilisent `STRIPE_SECRET_KEY_TEST` (qui existe déjà aussi).

Aucun changement de code nécessaire — toute la logique de basculement est déjà en place dans `stripe-config.ts` (backend) et `stripe-prices.ts` (frontend).

