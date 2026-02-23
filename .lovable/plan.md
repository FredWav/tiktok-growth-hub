
## Passage en mode test Stripe

### 1. Clé secrète Stripe

Remplacer le secret `STRIPE_SECRET_KEY` par ta clé de test Stripe (`sk_test_...`). Tu seras invité à saisir la nouvelle valeur.

### 2. Mise à jour des Price IDs

Remplacer les price IDs de production par les IDs de test qui viennent d'être créés :

| Offre | Ancien (prod) | Nouveau (test) |
|-------|---------------|----------------|
| One Shot 179 EUR | `price_1SHp2SBfuzQl0PTiBCmEAq2l` | `price_1T42X9BfuzQl0PTiuNshWAOv` |
| VIP 3 mois 297 EUR | `price_1T0UXNBfuzQl0PTiKGR1SBTV` | `price_1T42XUBfuzQl0PTinQWdURaT` |
| VIP 6 mois 495 EUR | `price_1T0UXRBfuzQl0PTir9qz5lUy` | `price_1T42XgBfuzQl0PTiHHToXEGl` |
| VIP 12 mois 891 EUR | `price_1T0UXTBfuzQl0PTi6KK2azBu` | `price_1T42XxBfuzQl0PTik4vf6tWc` |

### Fichiers modifiés

- **`supabase/functions/create-oneshot-checkout/index.ts`** : remplacer le price ID One Shot
- **`src/pages/VipCheckout.tsx`** : remplacer les 3 price IDs VIP

### Etape manuelle

Tu devras saisir ta clé secrète Stripe de test (`sk_test_...`) quand tu y seras invité.
