

## Plan : Passer Stripe en mode live

Deux changements nécessaires :

1. **Frontend** (`VITE_STRIPE_MODE`) : Changer la valeur de `"test"` à `"live"` dans le `.env` pour que le frontend utilise les Price IDs live.

2. **Backend** (secret `STRIPE_MODE`) : Mettre à jour le secret `STRIPE_MODE` à `"live"` pour que les Edge Functions utilisent la clé Stripe live et les Price IDs live.

Aucun changement de code nécessaire — la config dynamique est déjà en place.

