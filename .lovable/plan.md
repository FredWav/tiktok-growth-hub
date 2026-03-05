

## Plan : Analytics avancés dans l'onglet Marketing

### Problème
Tu veux voir dans le dashboard Marketing : sources de visites, durée des visites, pages les plus visitées, et le drop-off du parcours diagnostic. Aujourd'hui, ces données n'existent pas en base -- le tracking est sur PostHog/GA mais pas exploitable dans le dashboard admin.

### Approche

**1. Tracking des pages visitées** -- nouvelle table `page_views` + tracking côté client

Créer une table `page_views` légère qui enregistre chaque visite de page :
- `path` (URL)
- `referrer` (d'où vient le visiteur)
- `utm_source`, `utm_medium`, `utm_campaign`
- `session_id` (UUID généré côté client par session, stocké en sessionStorage)
- `entered_at` (timestamp d'arrivée)
- `duration_seconds` (mis à jour via `beforeunload` ou heartbeat)
- `visitor_id` (hash anonyme ou PostHog distinct_id, pour compter les visiteurs uniques)

RLS : INSERT pour tout le monde (anon), SELECT pour admins uniquement.

Condition GDPR : ne tracker que si `localStorage.getItem("cookie_consent") === "accepted"` (cohérent avec le consentement cookies existant).

**2. Composant de tracking** -- `src/lib/page-tracker.ts`

Un module appelé dans `PostHogPageTracker` (App.tsx) qui :
- Génère un `session_id` en sessionStorage s'il n'existe pas
- INSERT dans `page_views` à chaque changement de route (path, referrer, UTMs, timestamp)
- Met à jour `duration_seconds` via `beforeunload` (UPDATE sur la dernière ligne du session_id)

**3. Funnel du diagnostic** -- depuis `diagnostic_leads.current_step`

Requête sur `diagnostic_leads` groupée par `current_step` pour afficher un funnel chart :
```text
Étape 0 (démarré) → Étape 1 (identité) → Étape 2 (niveau) → ... → Étape 5 (complété)
```
Affiche le nombre de leads à chaque étape et le taux de drop-off entre chaque étape. Utilise un BarChart horizontal ou un FunnelChart.

**4. Nouveaux widgets dans Marketing.tsx**

Ajouter 3 sections au dashboard existant (au-dessus du tableau de leads) :

| Widget | Source de données | Visualisation |
|--------|------------------|---------------|
| **Pages les plus visitées** | `page_views` groupé par `path` | Table avec nb de vues + durée moyenne |
| **Sources de visites** | `page_views` groupé par `referrer` / `utm_source` | Donut chart (comme l'existant) |
| **Funnel diagnostic** | `diagnostic_leads` groupé par `current_step` | Bar chart horizontal avec taux de conversion |
| **Durée moyenne** | `page_views` avg `duration_seconds` | KPI card |

### Fichiers modifiés

| Fichier | Action |
|---------|--------|
| Migration SQL | Créer table `page_views` + RLS |
| `src/lib/page-tracker.ts` | Nouveau -- tracking des pages |
| `src/App.tsx` | Appeler le page tracker dans `PostHogPageTracker` |
| `src/pages/admin/Marketing.tsx` | Ajouter les 3 widgets + requêtes |

### Limites
- Les données commenceront à s'accumuler à partir du déploiement (pas de rétro-historique)
- La durée via `beforeunload` n'est pas 100% fiable sur mobile mais suffisant pour une estimation

