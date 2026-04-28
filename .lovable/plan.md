# Sync Wav Academy : migrations + déploiement record-wavacademy-consent

## État vérifié (repo Lovable est bien sur 11eae65 ou plus récent)

- ✅ `supabase/functions/record-wavacademy-consent/index.ts` présent dans le repo
- ✅ `supabase/functions/create-wavacademy-checkout/` absent (suppression volontaire confirmée)
- ✅ `src/pages/WavAcademy.tsx` ligne 225 invoke bien `record-wavacademy-consent`
- ✅ Migrations présentes dans le repo : `20260428000000_create_wavacademy_claims.sql` + `20260428120000_create_wavacademy_consents.sql`
- ❌ **Tables `wavacademy_claims` et `wavacademy_consents` absentes en base** (vérifié via `to_regclass` → NULL/NULL)
- ❌ Edge function `record-wavacademy-consent` non déployée (404 en prod)

Donc le repo est synchronisé, c'est juste que les migrations n'ont jamais tourné et la function n'a jamais été déployée sur l'instance Cloud.

## Actions à exécuter en mode Build

### 1. Appliquer les 2 migrations
Exécuter le SQL des deux fichiers via l'outil migration Lovable Cloud :
- `supabase/migrations/20260428000000_create_wavacademy_claims.sql` → crée `wavacademy_claims`
- `supabase/migrations/20260428120000_create_wavacademy_consents.sql` → crée `wavacademy_consents`

Vérification post-migration :
```sql
SELECT to_regclass('public.wavacademy_claims'), to_regclass('public.wavacademy_consents');
```
Doit renvoyer les 2 noms de tables (non NULL).

### 2. Déployer l'edge function
Déployer **uniquement** `record-wavacademy-consent` via `supabase--deploy_edge_functions`.

Pas besoin de toucher `supabase/config.toml` : la function est publique (appelée depuis le frontend sans JWT user), et le défaut Lovable est déjà `verify_jwt = false`. La function valide elle-même les inputs (plan ∈ {acces, live}, email, deux consentements).

### 3. Ne PAS recréer `create-wavacademy-checkout`
Si une erreur mentionne `STRIPE_PRICE_WAVACADEMY_ACCES` ou `STRIPE_PRICE_WAVACADEMY_LIVE` → on ignore. Ces secrets sont obsolètes (plus référencés nulle part dans le code). Le nouveau flux passe par les Stripe Payment Links codés en dur dans `record-wavacademy-consent/index.ts` (constante `PAYMENT_LINKS`).

### 4. Curl de validation
```
POST /functions/v1/record-wavacademy-consent
Body: {"plan":"acces","email":"test@example.com","consent_cgv":true,"consent_renonciation":true}
```
Attendu : HTTP 200 + `{ consent_id: "<uuid>", payment_url: "https://buy.stripe.com/dRm6oG9da4uZbLk2HecMM0w?client_reference_id=...&prefilled_email=test%40example.com" }`

Vérification base :
```sql
SELECT id, email, plan_type, consent_cgv, consent_renonciation, cgv_version 
FROM wavacademy_consents 
WHERE email='test@example.com' 
ORDER BY created_at DESC LIMIT 1;
```

### 5. Rapport final
Je renvoie : statut migrations, statut deploy, code HTTP du curl, payload JSON renvoyé, et confirmation de la ligne insérée.

## Notes techniques

- Aucun nouveau secret requis. Tous les secrets utilisés par `record-wavacademy-consent` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) sont auto-fournis et présents.
- `notifyError` (ITPush) est déjà câblé via `_shared/itpush.ts` et `ITPUSH_ENABLED` est dans les secrets.
- Les Stripe Payment Links sont publics et hardcodés (acces + live), donc rien à configurer côté secrets Stripe pour ce flux-là.