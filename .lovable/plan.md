

## Plan : Repasser Stripe en mode live

Deux changements de configuration, aucun changement de code :

1. **Secret `STRIPE_MODE`** → mettre à `"live"` (pour que les edge functions utilisent `STRIPE_SECRET_KEY` live)
2. **`.env` : `VITE_STRIPE_MODE`** → mettre à `"live"` (pour que le frontend utilise les Price IDs live)

