

## Diagnostic

Le problème est clair : les logs montrent `"Missing X-API-Key header"`. La documentation API v1.1 spécifie que l'authentification se fait via le header `X-API-Key`, mais le code `express-pdf` envoie `Authorization: Bearer`.

Ligne 34-35 actuelle :
```
"Authorization": `Bearer ${apiKey}`,
```

La doc (page 3) dit :
```
-H "X-API-Key: wav_votre_cle_api"
```

## Correction

**Fichier : `supabase/functions/express-pdf/index.ts`**

- Remplacer le header `Authorization: Bearer ${apiKey}` par `X-API-Key: ${apiKey}` (ligne 35)
- C'est le seul changement nécessaire

Ce même problème pourrait aussi exister dans `express-analysis` et `express-analysis-status` -- il faudra vérifier que ces fonctions utilisent aussi `X-API-Key`.

