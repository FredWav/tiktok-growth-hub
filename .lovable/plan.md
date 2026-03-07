

## Ajouter la collecte d'email au diagnostic

Le formulaire actuel ne collecte pas l'email. Il faut l'ajouter comme étape obligatoire et le transmettre à la notification.

### Changements

**1. `src/contexts/DiagnosticContext.tsx`**
- Ajouter `email: string` au type `DiagnosticData` et au `defaultData`
- L'inclure dans la vérification `isComplete`

**2. `src/pages/DiagnosticStart.tsx`**
- Passer de 6 à 7 étapes (`TOTAL_STEPS = 7`)
- Ajouter une **Step 7 : Email** juste avant le blocage (ou juste après l'identité — au choix, mais stratégiquement mieux en fin de funnel, juste avant le blocage, car l'utilisateur est déjà engagé)
- Champ email avec validation Zod (`z.string().email()`)
- Sauvegarder l'email dans `diagnostic_leads` via `saveLead({ email: data.email }, stepNum)`
- Inclure `email` dans le body de `notify-diagnostic`

**3. `supabase/functions/notify-diagnostic/index.ts`**
- Remettre l'email dans les notifications Discord et SMTP (déjà géré comme optionnel, rien à changer côté edge function)

### Positionnement de l'étape email

L'email sera collecté en **Step 6** (avant le blocage qui devient Step 7). C'est le moment où l'utilisateur est le plus engagé et le plus susceptible de laisser son email. Ordre final :

1. Identité (prénom + TikTok)
2. Audience
3. Objectif
4. Budget
5. Temps
6. **Email** (nouveau)
7. Blocage

