

## Probleme identifie

Les logs backend montrent cette erreur :
> "No such price: 'price_1T42hpBfuzQl0PTiAwqezEJq'; **a similar object exists in test mode, but a live mode key was used**"

Les 4 Price IDs dans ton code ont ete crees en **mode test** sur Stripe. Maintenant que la cle secrete est en **mode live**, ces IDs ne sont pas reconnus.

## Solution

Creer les produits et prix en **mode live** sur Stripe, puis mettre a jour les 4 Price IDs dans le code.

## Etapes

### 1. Creer les produits et prix live sur Stripe (via outils Stripe)

| Produit | Prix |
|---------|------|
| One Shot - Session Strategie TikTok | 179 EUR (paiement unique) |
| VIP 3 mois | 297 EUR (paiement unique) |
| VIP 6 mois | 495 EUR (paiement unique) |
| VIP 12 mois | 891 EUR (paiement unique) |

### 2. Mettre a jour les Price IDs dans le code

Trois fichiers a modifier :

- **`supabase/functions/create-oneshot-checkout/index.ts`** : remplacer le price ID a la ligne 24
- **`src/pages/VipCheckout.tsx`** : remplacer les 3 price IDs aux lignes 17-19

### 3. Redeployer les fonctions backend

La fonction `create-oneshot-checkout` sera automatiquement redeployee apres modification.

### 4. Tester le flux de paiement

Verifier que le bouton "Reserver mon One Shot" redirige bien vers la page de paiement Stripe en mode live.

## Details techniques

Les modifications sont mineures : 4 chaines de caracteres (Price IDs) a remplacer par les nouveaux IDs live. Aucun changement de logique ou d'architecture.
