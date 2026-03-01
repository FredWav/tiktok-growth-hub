

## Plan : Notifications Push itpush.dev

### 1. Fichier utilitaire `supabase/functions/_shared/itpush.ts`

Creer une fonction helper reutilisable :
- Verifie `ITPUSH_ENABLED` (env var) — si absent ou `"false"`, skip silencieusement
- API key et project ID en dur (valeurs publiques fournies par l'utilisateur)
- Fonction `notifySuccess(title, message)` et `notifyError(title, message)`
- Catch les erreurs sans bloquer le flow principal

### 2. Integration dans les edge functions

Ajouter des appels `notifySuccess` / `notifyError` dans :

- **`send-oneshot-form`** : succes apres insert DB + Discord, erreur si paiement invalide ou echec global
- **`stripe-webhook`** : succes apres creation VIP subscription, erreur si insertion echoue
- **`express-analysis`** : succes au lancement d'analyse, erreur si paiement invalide ou API echoue
- **`express-analysis-status`** : succes quand analyse complete, erreur si analyse echouee ou AI manquante
- **`notify-application`** : succes apres envoi Discord candidature, erreur si webhook echoue

### 3. Variable d'environnement

- `ITPUSH_ENABLED` : mettre a `"true"` pour activer, toute autre valeur ou absence = desactive
- A configurer comme secret dans le backend

### Fichiers modifies
- `supabase/functions/_shared/itpush.ts` (nouveau)
- `supabase/functions/send-oneshot-form/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/express-analysis/index.ts`
- `supabase/functions/express-analysis-status/index.ts`
- `supabase/functions/notify-application/index.ts`

