## Déploiement Wav Academy prépayé (1/3/6 mois)

Les deux migrations et les trois edge functions sont déjà sur `main`, il reste à les appliquer sur Supabase.

### 1. Migrations à appliquer

**`20260601000000_wavacademy_prepaid_terms.sql`**
- Ajoute `access_months` (int) sur `wavacademy_consents`
- Ajoute `access_months` (int) et `access_expires_at` (timestamptz) sur `wavacademy_subscriptions`
- Crée l'index partiel `idx_wavacademy_subscriptions_expiry` sur les abonnements actifs

**`20260601000001_schedule_revoke_expired_wavacademy.sql`**
- Active `pg_cron` et `pg_net`
- Planifie le job `revoke-expired-wavacademy-daily` à 03:00 UTC qui appelle l'edge function de révocation

Les deux migrations sont rejouables (IF NOT EXISTS, unschedule avant reschedule).

### 2. Edge functions à redéployer

- `record-wavacademy-consent` — capture `access_months` (1/3/6) au consentement
- `stripe-webhook` — calcule `access_expires_at` pour les paiements uniques 3/6 mois, laisse NULL pour le récurrent 1 mois
- `revoke-expired-wavacademy` — cron quotidien qui retire le rôle Discord et passe les abonnements expirés en `status='expired'`

### 3. Régénération des types

Après l'exécution des migrations, `src/integrations/supabase/types.ts` est régénéré automatiquement pour exposer les nouvelles colonnes (`access_months`, `access_expires_at`). Le hook `useWavAcademyConsents` les utilise déjà en optional.

### Ordre d'exécution

1. Migration `20260601000000` (colonnes) — bloquante
2. Migration `20260601000001` (cron) — dépend de l'edge function déployée pour fonctionner réellement
3. Déploiement des 3 edge functions
4. Régénération auto des types

### Vérifications post-déploiement

- Colonnes `access_months` / `access_expires_at` visibles dans le schéma
- Job `revoke-expired-wavacademy-daily` listé dans `cron.job`
- Les 3 edge functions répondent (logs sans erreur au démarrage)
