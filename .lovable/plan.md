

## Repasser Stripe en mode live

Deux changements symétriques à l'activation du mode test :

1. **`src/config/stripe-prices.ts`** — Remettre le default de `"test"` à `"live"`
2. **Secret `STRIPE_MODE`** — Mettre à jour la valeur de `"test"` à `"live"`

Les Price IDs live et la clé `STRIPE_SECRET_KEY` (live) sont déjà en place — aucun autre changement nécessaire.

