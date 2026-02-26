## Passer Stripe en mode test

L'architecture multi-mode est déjà en place avec les Price IDs test et live dans les deux fichiers de config. Il suffit de basculer.

### Changements

1. **Frontend (`src/config/stripe-prices.ts`)** — Changer le default de `"live"` à `"test"` pour que le frontend utilise les Price IDs test sans dépendre d'une variable d'environnement.
2. **Secret `STRIPE_MODE**` — Mettre à jour la valeur du secret existant de `"live"` à `"test"` pour les Edge Functions.
3. **Secret `STRIPE_SECRET_KEY**` — Tu devras remplacer ta clé `sk_live_...` par ta clé `sk_test_...` depuis ton dashboard Stripe. Je te demanderai de la saisir.

### Ce qui est déjà sauvegardé

Les Price IDs live restent dans le code, dans l'objet `PRICE_IDS.live` des deux fichiers de config. Quand tu voudras repasser en prod, il suffira de :

- Remettre le default à `"live"` dans `stripe-prices.ts`
- Remettre `STRIPE_MODE` à `"live"`
- Remettre la clé `sk_live_...` dans `STRIPE_SECRET_KEY`  
  
`Au lieu de remplacer la clé actuelle créer un nouveau secret de stripe scret key test et ça switch de key en fonction de si on est en live ou en test`