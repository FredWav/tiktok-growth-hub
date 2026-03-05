

## Plan : Persistance du step 2 + sécurité anti-contournement

### Analyse de la sécurité actuelle

La page `/one-shot/success` vérifie **déjà** le paiement côté serveur via `verify-oneshot-payment` (qui appelle Stripe pour confirmer `payment_status === "paid"`). Sans `session_id` valide et payé, la page affiche une erreur. Le lien Calendly n'est **jamais** accessible sans paiement vérifié.

Le vrai problème : quand le formulaire est soumis (step 1 → step 2), le `localStorage` est vidé (ligne 89). Si le client perd le réseau ou ferme l'onglet avant de cliquer sur Calendly, il ne peut plus revenir sur la page.

### Modifications sur `src/pages/OneShotSuccess.tsx`

1. **Ne plus supprimer `oneshot_session_id` du localStorage à l'envoi du formulaire** (ligne 89) -- le garder pour permettre le retour.

2. **Persister l'état "formulaire soumis"** : après envoi réussi, stocker `oneshot_form_submitted = "true"` dans localStorage.

3. **Au chargement** : après vérification du paiement réussie, vérifier si `oneshot_form_submitted === "true"`. Si oui, sauter directement au step 2.

4. **Remplacer le lien "Retour à l'accueil"** par un bouton **"J'ai réservé mon créneau"** qui :
   - Nettoie `oneshot_session_id` et `oneshot_form_submitted` du localStorage
   - Redirige vers `/`

### Résultat

- La vérification Stripe côté serveur reste la barrière d'accès -- pas de contournement possible.
- Un client qui a payé + soumis le formulaire peut revenir sur `/one-shot/success` et retrouver le lien Calendly.
- Le localStorage n'est nettoyé que quand le client confirme explicitement avoir réservé.

Un seul fichier modifié.

