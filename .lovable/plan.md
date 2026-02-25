

## Plan : Corriger le header d'authentification de l'API WavSocialScan

### Diagnostic

L'API externe WavSocialScan retourne une 401 avec le message `"Missing X-API-Key header"`. Le code actuel envoie la clé via `Authorization: Bearer <key>`, mais l'API attend un header `X-API-Key: <key>`.

### Correction

**Fichier : `supabase/functions/express-analysis/index.ts`**

Remplacer les headers d'authentification aux deux endroits :

1. **Ligne 41** (appel POST /analyze) : remplacer `"Authorization": \`Bearer ${apiKey}\`` par `"X-API-Key": apiKey`
2. **Ligne 59** (appel GET /accounts) : même remplacement `"Authorization": \`Bearer ${apiKey}\`` par `"X-API-Key": apiKey`

### Résultat attendu

L'API WavSocialScan recevra le bon header et ne retournera plus de 401. L'analyse TikTok pourra se lancer normalement après paiement.

