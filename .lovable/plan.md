

## Diagnostic

### 1. Suivi campagnes/médias/sources
Le dashboard Marketing a bien les **sources de visites** (depuis `page_views`) et les **sources de leads** (depuis les formulaires). Mais il manque un **suivi par campagne** et **par medium** -- les données `utm_medium` et `utm_campaign` sont collectées dans `page_views` mais jamais affichées. Il n'y a pas de tableau qui regroupe par campagne ou par medium.

### 2. Pipeline estimé cassé
Le "Pipeline estimé" (ligne 266-275) somme le champ `current_revenue` des leads Wav Premium -- c'est le **CA auto-déclaré par le candidat**, pas le revenu généré. La vente One Shot de ce matin n'y apparaît pas car One Shot n'a pas de champ `current_revenue`. Le pipeline devrait refléter les **ventes réelles** (montants payés) plutôt que le CA déclaré des prospects.

---

## Plan de correction

### A. Ajouter un tableau de suivi Campagnes / Médias / Sources

Dans `Marketing.tsx`, ajouter une nouvelle section avec 3 sous-tableaux (ou un tableau combiné) qui agrège `page_views` par :
- **utm_source** (source) -- ex: tiktok, instagram, google
- **utm_medium** (medium) -- ex: social, cpc, email  
- **utm_campaign** (campagne) -- ex: launch-q1, promo-mars

Chaque ligne montre : nom, nombre de visites, nombre de visiteurs uniques, durée moyenne. Utiliser un `useMemo` qui groupe les `pageViews` par ces 3 dimensions.

### B. Corriger le Pipeline estimé

Remplacer le calcul basé sur `current_revenue` (CA auto-déclaré) par un calcul basé sur les **ventes réelles** :
- Requêter la table `bookings` (filtre `payment_status = 'paid'`) pour les montants réels
- Ajouter aussi les `oneshot_submissions` avec un prix fixe (le prix One Shot) puisqu'elles sont validées par Stripe
- Afficher le **revenu réel** du mois en cours au lieu du "pipeline estimé"

Concrètement :
1. Ajouter une query `bookings` + compter les `oneshot_submissions` du mois
2. Remplacer `pipelineValue` par le total réel (bookings.amount_cents + oneshot count * prix One Shot)
3. Renommer le KPI en "Revenu du mois" ou "CA généré"

### Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/pages/admin/Marketing.tsx` | Ajouter tableau campagnes/médias/sources + corriger pipeline |

