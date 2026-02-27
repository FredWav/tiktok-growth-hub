

## Plan : Notification candidature via Discord webhook

### Modification unique : `supabase/functions/notify-application/index.ts`

Remplacer l'envoi email SMTP par un POST vers le webhook Discord :
- URL : `https://discord.com/api/webhooks/1476936142149390498/PWhNWcdB4iqoFrfF7dFAdhpeMDwuLPNjvGiuZxp_0ubpjdxncA2UFTHcXMZzPiXtT6Bg`
- Mention : `<@1409844507607957556>`
- Format : embed Discord avec les infos de la candidature (nom, email, TikTok, niveau, blockers, goals, budget)
- Supprimer la dépendance nodemailer et le code SMTP

Aucun autre fichier ne change — le frontend appelle déjà `notify-application` correctement.

