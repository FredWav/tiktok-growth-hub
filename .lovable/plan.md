
## Remplacement de Resend par le serveur SMTP OVH

### Objectif
Remplacer l'envoi d'email via l'API Resend par un envoi SMTP direct via le serveur OVH, en utilisant l'adresse `noreply@fredwav.com`.

### Configuration SMTP
- **Serveur** : ssl0.ovh.net
- **Port** : 465 (SSL/TLS)
- **Expediteur** : noreply@fredwav.com

### Etapes

#### 1. Ajouter le secret du mot de passe SMTP
Demander la saisie securisee du mot de passe de l'adresse `noreply@fredwav.com` via le gestionnaire de secrets. Ce secret sera stocke sous le nom `SMTP_PASSWORD`.

#### 2. Modifier la fonction `send-oneshot-form`

**Fichier** : `supabase/functions/send-oneshot-form/index.ts`

- Supprimer tout le code lie a Resend (API key, fetch vers api.resend.com)
- Importer une librairie SMTP compatible Deno : `https://deno.land/x/smtp/mod.ts` (denomailer)
- Configurer la connexion SMTP avec :
  - hostname: `ssl0.ovh.net`
  - port: `465`
  - username: `noreply@fredwav.com`
  - password: depuis le secret `SMTP_PASSWORD`
  - tls: true
- Envoyer l'email HTML existant (le contenu du mail ne change pas) depuis `noreply@fredwav.com` vers `fredwavcm@gmail.com`

#### 3. Redeployer la fonction

La fonction sera automatiquement redeployee apres modification.

### Details techniques

La librairie `denomailer` (`https://deno.land/x/denomailer/mod.ts`) est la solution standard pour envoyer des emails via SMTP depuis Deno/Edge Functions. Elle supporte :
- Connexion TLS directe (port 465)
- Authentification LOGIN/PLAIN
- Contenu HTML

Structure du code SMTP :
```text
import { SMTPClient } from denomailer

client = new SMTPClient({
  connection: {
    hostname: "ssl0.ovh.net",
    port: 465,
    tls: true,
    auth: {
      username: "noreply@fredwav.com",
      password: SMTP_PASSWORD
    }
  }
})

client.send({
  from: "noreply@fredwav.com",
  to: "fredwavcm@gmail.com",
  subject: "...",
  html: htmlBody
})

client.close()
```

Le reste de la fonction (validation des champs, verification Stripe) reste identique.
