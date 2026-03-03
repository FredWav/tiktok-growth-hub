

## Plan : Notification Discord + Email SMTP à la fin du diagnostic /start

### 1. Nouvelle edge function `supabase/functions/notify-diagnostic/index.ts`

Suivre exactement le pattern de `notify-application` + `send-oneshot-form` :

- **Discord webhook** : Envoyer un embed avec tous les champs du lead (Nom, Email, TikTok, Niveau, Objectif, Blocker, Budget, Offre recommandée) vers le même webhook Discord existant, avec mention des admins
- **Email SMTP OVH** : Envoyer un email HTML récapitulatif via nodemailer (même config que `send-oneshot-form` : `ssl0.ovh.net:465`, `noreply@fredwav.com` → `fredwavcm@gmail.com`) avec le secret `SMTP_PASSWORD`
- **itpush** : Notifications succès/erreur via `notifySuccess`/`notifyError`
- CORS headers standard, `verify_jwt = false` dans config.toml

### 2. Modifier `src/pages/DiagnosticStart.tsx`

Dans `handleBudgetSelect`, après le `saveLead` (qui marque `completed: true`), appeler la edge function :

```typescript
supabase.functions.invoke("notify-diagnostic", {
  body: {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    tiktok: data.tiktok,
    level: data.level,
    objective: data.objective,
    blocker: data.blocker,
    budget,
    recommended_offer: getRecommendedOffer(budget),
  },
});
```

Appel fire-and-forget (pas de `await`) pour ne pas bloquer l'affichage du résultat.

### 3. Config

Ajouter `[functions.notify-diagnostic]` avec `verify_jwt = false` dans `supabase/config.toml`.

