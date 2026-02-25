

## Plan : Passer le polling côté client pour éviter le timeout Edge Function

### Diagnostic

L'Edge Function `express-analysis` fait du polling serveur (jusqu'à 90s, toutes les 5s) en attendant que l'API WavSocialScan finisse l'analyse. Mais les Edge Functions ont un timeout strict (~150s) et le temps de boot + vérification Stripe + lancement analyse + polling = timeout. L'analyse est bien terminée côté API, mais la fonction expire avant de récupérer le résultat.

### Solution

Séparer en 2 fonctions : une pour lancer l'analyse, une pour vérifier le statut. Le polling se fait côté client (pas de timeout).

```text
Avant (tout dans express-analysis, timeout serveur) :
  Client → express-analysis → Stripe check → POST /analyze → poll GET /accounts (90s max) → réponse

Après (polling côté client, pas de timeout) :
  Client → express-analysis → Stripe check → POST /analyze → retourne username immédiatement
  Client → express-analysis-status (toutes les 3s) → GET /accounts → résultat quand prêt
```

### Modifications

**Fichier 1 : `supabase/functions/express-analysis/index.ts`**

- Supprimer tout le bloc de polling (lignes 52-74)
- Après le POST /analyze réussi, retourner immédiatement `{ username, status: "processing" }` au client
- La fonction ne fait plus que : vérifier Stripe + lancer l'analyse + retourner

**Fichier 2 (nouveau) : `supabase/functions/express-analysis-status/index.ts`**

- Nouvelle Edge Function qui prend `{ session_id }` en entrée
- Vérifie le paiement Stripe (sécurité)
- Extrait le username depuis les metadata Stripe
- Fait UN SEUL appel GET `/accounts/{username}` à l'API WavSocialScan
- Si `health_score.total` est défini → retourne `{ status: "complete", data, username }`
- Sinon → retourne `{ status: "processing", username }`

**Fichier 3 : `src/pages/AnalyseExpressResult.tsx`**

- Modifier `fetchAnalysis` : appeler `express-analysis` une seule fois pour lancer l'analyse
- Récupérer le `username` de la réponse et l'afficher pendant le chargement
- Implémenter un polling client avec `setInterval` toutes les 3 secondes appelant `express-analysis-status`
- Quand `status === "complete"` : stopper le polling, afficher les résultats
- Timeout client de 3 minutes max, puis afficher une erreur avec bouton Réessayer
- Nettoyer l'interval au unmount du composant

**Fichier 4 : `supabase/config.toml`** (ne sera pas édité manuellement, juste pour info)

- Ajouter `verify_jwt = false` pour la nouvelle fonction `express-analysis-status`

### Détails techniques

- Le polling côté client à 3s au lieu de 5s permet de récupérer le résultat plus vite dès que l'API a fini
- La vérification Stripe dans `express-analysis-status` empêche un accès non autorisé
- Le timeout de 3 minutes côté client est largement suffisant et n'a pas les contraintes des Edge Functions
- Les deux fonctions restent légères et rapides (< 5s chacune)

