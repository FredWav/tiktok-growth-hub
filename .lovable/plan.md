

# VIP 12 mois : passer a 3 mois offerts et mise en avant visuelle

## Changements de prix

| | Avant | Apres |
|---|---|---|
| Mois offerts | 2 | 3 |
| Prix total | 990€ | 891€ |
| Prix/mois | 82.5€ | 74.25€ |
| Badge | "2 mois offerts" | "3 mois offerts" |

Les plans 3 mois (297€) et 6 mois (495€, 1 mois offert) restent inchanges.

## Mise en avant visuelle du plan 12 mois

- Le plan 12 mois sera pre-selectionne par defaut (au lieu du plan 3 mois)
- Ajout d'un style plus visible sur le badge "3 mois offerts" (plus grand, couleur or/primary plus marquee)
- Legere mise en echelle ou bordure plus epaisse pour attirer l'oeil

## Impact Stripe

Le `priceId` du plan 12 mois (`price_1T0UXTBfuzQl0PTi6KK2azBu`) devra correspondre au nouveau prix de 891€ dans Stripe. Il faudra soit :
- Mettre a jour le prix dans le dashboard Stripe
- Ou creer un nouveau prix Stripe a 891€ et mettre a jour le `priceId` dans le code

## Details techniques

- Fichier modifie : `src/pages/VipCheckout.tsx`
  - Mettre a jour l'objet du plan 12 mois : `total: 891`, `monthly: 74.25`, `savings: "3 mois offerts"`
  - Changer `selectedPlan` initial de `0` a `2` (pre-selection 12 mois)
  - Ajouter un style visuel renforce sur le plan 12 mois (ex: `ring-2 ring-primary scale-105`)
- Fichier modifie : `src/pages/Offres.tsx` (si le prix VIP y est mentionne, mettre a jour la coherence)

