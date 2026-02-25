

## Plan : Mettre à jour la clé Stripe vers le mode test

### Contexte
Le projet utilise actuellement une clé Stripe **live** (`sk_live_`). Tu souhaites passer en mode **test** (`sk_test_`).

### Ce qui sera fait
1. **Mise à jour du secret `STRIPE_SECRET_KEY`** — Je vais te demander de saisir ta clé secrète Stripe de test (commençant par `sk_test_...`) via l'outil sécurisé de gestion des secrets.

2. **Mise à jour des Price IDs** — Les Price IDs live ne fonctionnent pas avec une clé test. Tu devras me fournir les Price IDs de test correspondants (depuis ton Dashboard Stripe en mode Test) pour :
   - Analyse Express (actuellement `price_1T4jWYBfuzQl0PTi49WCSZBy`)
   - One Shot (actuellement `price_1T43v7BfuzQl0PTiIP3fmwFh`)
   - VIP 3/6/12 mois (actuellement `price_1T43vg...`, `price_1T43w4...`, `price_1T43wE...`)

3. **Fichiers impactés** (après réception des Price IDs test) :
   - `supabase/functions/create-express-checkout/index.ts`
   - `supabase/functions/create-oneshot-checkout/index.ts`
   - `supabase/functions/create-vip-checkout/index.ts`

### Étape immédiate
Je vais d'abord te demander de saisir ta nouvelle clé `STRIPE_SECRET_KEY` de test.

