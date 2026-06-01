## Diagnostic

Le bouton fonctionne et le backend reçoit bien les soumissions (dernière reçue ce matin à 09:41). Le problème est purement visuel : quand un champ obligatoire est vide ou invalide, `react-hook-form` se contente d'afficher un message rouge sous le champ. **Aucun toast, aucun scroll automatique.** Sur mobile (viewport actuel 393px), si l'erreur est au-dessus de l'écran, l'utilisateur clique sur "Envoyer ma demande" et a l'impression que le bouton est cassé.

Cas typiques : email mal formaté, profil/motivation/accompagnement non cochés, budget non sélectionné, déclencheur < 10 caractères.

## Correctif

Dans `src/pages/ReserverUnAppel.tsx`, modifier le callback d'erreur de `form.handleSubmit` (ligne 303) pour :

1. Afficher un `toast.error` clair : "Vérifie les champs en rouge avant d'envoyer." (sonner déjà importé).
2. Scroller automatiquement vers le premier champ en erreur (`document.querySelector` sur l'id du premier champ retourné par `errors`, ou utiliser `form.setFocus(firstErrorField)` qui scrolle + focus en une fois).
3. Conserver le tracking PostHog existant (`reserverunappel_form_error`).

Aucune autre modification (pas de touche au schéma Zod, au payload, à l'edge function, ni à la migration). Seul le handler d'erreur change.

## Validation après build

- Recharger `/reserverunappel`, cliquer "Envoyer" sans rien remplir → toast rouge + scroll/focus sur le champ Prénom.
- Remplir tout sauf le budget → toast + scroll sur le select Budget.
- Remplir correctement → soumission OK comme aujourd'hui.
