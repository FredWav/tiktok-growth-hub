## Plan : Passer Stripe en production

### Situation actuelle

Le projet utilise des Price IDs en mode **test** (`price_1T4ji...`). Le `STRIPE_SECRET_KEY` est aussi en mode test (`sk_test_`). Il faut :

1. Mettre a jour la cle secrete Stripe vers la cle live (`sk_live_...`)
2. Recreer les 5 produits/prix en mode live dans Stripe
3. Mettre a jour les Price IDs dans le code

### Etape 1 — Mise a jour de la cle secrete

Je vais te demander de mettre a jour le `STRIPE_SECRET_KEY` avec ta cle live (`sk_live_...`). Tu la trouves dans ton dashboard Stripe > Developers > API keys (en mode live, pas test).

### Etape 2 — Creation des produits en mode live

Une fois la cle live active, je cree les 5 produits via l'API Stripe :


| Produit         | Prix       | Devise   |
| --------------- | ---------- | -------- |
| Analyse Express | 11,90 EUR  | one-time |
| One Shot        | 179,00 EUR | one-time |
| VIP 3 mois      | 297,00 EUR | one-time |
| VIP 6 mois      | 495,00 EUR | one-time |
| VIP 12 mois     | 891,00 EUR | one-time |


### Etape 3 — Mise a jour du code

Remplacement des Price IDs dans 3 fichiers :


| Fichier                                               | Modification                     |
| ----------------------------------------------------- | -------------------------------- |
| `supabase/functions/create-express-checkout/index.ts` | Nouveau price ID Analyse Express |
| `supabase/functions/create-oneshot-checkout/index.ts` | Nouveau price ID One Shot        |
| `src/pages/VipCheckout.tsx`                           | 3 nouveaux price IDs VIP         |


### Ordre d'execution

1. Te demander la cle `sk_live_...`
2. Creer les 5 produits/prix
3. Mettre a jour les 3 fichiers avec les nouveaux IDs
4. Redeployer les edge functions  
  
  
  
FAIT EN SORTE QUE L4ON PUISSE SWITCH FACILEMENT ENTRE TEST ET PROD? SANS TOUT RECHANGER 0 CHAQUE FOIS SAUVEGARDE 