

## Corriger l'envoi d'email SMTP et supprimer Resend

### Probleme

La bibliothèque `denomailer` ne fonctionne pas dans l'environnement Edge Functions. Les erreurs `BadResource` et `invalid cmd` dans les logs montrent que les connexions TCP/TLS brutes ne sont pas supportees correctement par le runtime.

De plus, la page admin Settings affiche encore "Resend" dans les integrations.

### Solution

Remplacer `denomailer` par `nodemailer` via le specifier `npm:`. Deno supporte les modules npm nativement, et `nodemailer` est la bibliothèque d'envoi d'email la plus stable et testee.

### Modifications

#### 1. `supabase/functions/send-oneshot-form/index.ts`

- Remplacer l'import `denomailer` par `npm:nodemailer`
- Adapter la configuration du transporteur SMTP :

```text
import nodemailer from "npm:nodemailer@6.9.16";

const transporter = nodemailer.createTransport({
  host: "ssl0.ovh.net",
  port: 465,
  secure: true,
  auth: {
    user: "noreply@fredwav.com",
    pass: SMTP_PASSWORD,
  },
});

await transporter.sendMail({
  from: "noreply@fredwav.com",
  to: "fredwavcm@gmail.com",
  subject: "...",
  html: htmlBody,
});
```

- Le reste du code (validation, verification Stripe, contenu HTML) reste identique

#### 2. `src/pages/admin/Settings.tsx` (lignes 66-72)

Remplacer la section "Resend" par "OVH Mail" :

- "Resend" devient "OVH Mail"
- "Envoi d'emails" devient "Envoi d'emails (SMTP)"

### Pourquoi nodemailer

- Bibliothèque la plus utilisee pour l'envoi d'email (5M+ telechargements/semaine)
- Support natif via `npm:` dans Deno Edge Functions
- Gère correctement TLS implicite (port 465) et STARTTLS (port 587)
- Pas de problème avec les connexions TCP brutes comme denomailer

