## Ce que j'ai trouvé

- 0 nouvelle ligne dans `wav_premium_applications` aujourd'hui (3 juin). Dernière entrée : Arnaud Laplace le 2 juin à 17:29.
- 0 log côté edge function `notify-application` aujourd'hui.
- Conclusion : le formulaire n'a **jamais** déclenché ni l'email/Discord, ni l'insert DB pour cette personne.

## Cause la plus probable

Dans `src/pages/ReserverUnAppel.tsx` (lignes 121-128), si l'utilisateur choisit le budget **« De 10€ à 100€ »** (`10_a_100`), le `onSubmit` fait un early-return :

```ts
if (data.budget === "10_a_100") {
  setRedirectToAcademy(true);
  return;   // <-- aucune notification, aucun insert DB
}
```

→ Le lead est **perdu silencieusement**. Aucun email, aucun Discord, aucune trace en base. Si la personne avait un petit budget (cas courant sur mobile), c'est exactement ce qui s'est passé deux fois.

Hypothèse secondaire écartée : RLS / schéma OK, la function `notify-application` n'a juste pas été appelée.

## Correctif proposé

1. **Toujours notifier + insérer avant de rediriger vers Wav Academy.**
   Dans `onSubmit`, déplacer le bloc « invoke notify-application + insert DB » avant le check `budget === "10_a_100"`, puis seulement ensuite faire `setRedirectToAcademy(true)`. Comme ça :
   - Tu reçois l'email + Discord même pour les budgets bas
   - La personne est quand même redirigée vers Wav Academy
   - On peut tagger la notif (ex: `recommended_offer: "wav_academy"`) pour que tu voies d'un coup d'œil que c'est un lead « petit budget »

2. **Ajouter un toast d'erreur visible** si l'invoke échoue, pour éviter qu'un futur problème réseau passe inaperçu côté utilisateur.

3. **(Optionnel) Logguer côté edge function** le start de chaque requête pour qu'on ait une trace même quand le payload est rejeté par Zod/CORS.

## Fichiers touchés

- `src/pages/ReserverUnAppel.tsx` — réordonner `onSubmit` + ajouter le tag `recommended_offer`.

Aucune migration, aucun changement d'edge function nécessaire (sauf le point 3 si tu le veux).

## À confirmer

Veux-tu que j'applique le correctif (points 1 + 2) ? Et est-ce que tu veux aussi le log côté edge function (point 3) ?