

## Plan : Page admin Candidatures + Notification email

### 1. Créer la page admin `/admin/applications`

Nouvelle page `src/pages/admin/Applications.tsx` qui affiche un tableau des candidatures depuis la table `wav_premium_applications` :
- Colonnes : Date, Prénom/Nom, Email, TikTok, Niveau, Budget confirmé
- Possibilité de cliquer pour voir les détails (blockers, goals) dans un dialog
- Style identique aux autres pages admin (cf. `ExpressAnalyses.tsx`)

### 2. Créer le hook `useWavPremiumApplications`

Nouveau hook `src/hooks/useWavPremiumApplications.ts` pour fetcher les candidatures depuis `wav_premium_applications`.

### 3. Ajouter la route et le lien sidebar

- `src/App.tsx` : ajouter la route `/admin/applications` protégée
- `src/components/layout/AdminLayout.tsx` : ajouter l'entrée "Candidatures" dans le menu sidebar (icône `ClipboardList`)

### 4. Edge function `notify-application` pour envoyer un email

Nouvelle edge function `supabase/functions/notify-application/index.ts` :
- Envoi un email via SMTP OVH (nodemailer, comme `send-oneshot-form`)
- From : `noreply@fredwav.com` → To : `fredwavcm@gmail.com`
- Contenu : résumé de la candidature (nom, email, tiktok, niveau, blockers, goals)
- Appelée depuis le frontend après l'insert réussi dans `WavPremiumApplication.tsx`

### 5. Mettre à jour `supabase/config.toml`

Ajouter la config pour la nouvelle edge function avec `verify_jwt = false`.

### 6. Appeler la notification depuis le formulaire

Dans `src/pages/WavPremiumApplication.tsx`, après l'insert réussi, appeler `supabase.functions.invoke('notify-application', { body: data })`.

