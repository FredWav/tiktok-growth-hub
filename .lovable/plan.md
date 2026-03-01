

## Diagnostic

Le formulaire One Shot (`OneShotSuccess.tsx`) appelle `send-oneshot-form` qui :
1. Verifie le paiement Stripe
2. Envoie un email SMTP vers fredwavcm@gmail.com

Problemes identifies :
- **Aucune sauvegarde en DB** : les reponses du formulaire ne sont enregistrees nulle part. La table `bookings` existe mais n'est jamais alimentee par ce flow.
- **Pas de webhook Discord** : contrairement aux candidatures Wav Premium et aux analyses express, le One Shot n'envoie aucune notification Discord.
- **L'email SMTP peut echouer silencieusement** : si le SMTP OVH est down ou si le mot de passe a change, aucune trace n'est conservee.

## Solution

### 1. Modifier `send-oneshot-form` (edge function)

Ajouter 3 choses a la function existante :

**a) Sauvegarder les reponses en DB** dans la table `bookings` :
- `stripe_session_id` = session_id
- `offer` = 'one_shot'
- `amount_cents` = montant depuis la session Stripe
- `payment_status` = 'paid'
- `paid_at` = now

Probleme : `bookings` requiert un `client_id` (FK). Comme le One Shot n'a pas de compte client, il faut soit rendre `client_id` nullable, soit creer une table dediee.

**Alternative plus simple** : creer une table `oneshot_submissions` avec les champs du formulaire + `stripe_session_id` + `created_at`. Pas de FK vers clients.

**b) Envoyer un webhook Discord** avec les infos du formulaire (meme pattern que `notify-application`).

**c) Garder l'envoi email SMTP** comme backup.

### 2. Migration DB : creer `oneshot_submissions`

```sql
CREATE TABLE public.oneshot_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  tiktok text NOT NULL,
  objectives text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oneshot_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage oneshot_submissions"
  ON public.oneshot_submissions FOR ALL
  USING (has_role(auth.uid(), 'admin'));
```

### 3. Modifier `send-oneshot-form/index.ts`

- Ajouter un client Supabase (service role) pour inserer dans `oneshot_submissions`
- Ajouter un appel Discord webhook avec les infos du formulaire
- Garder l'envoi email SMTP existant
- Si l'email echoue, ne pas bloquer (les donnees sont en DB + Discord)

### Fichiers modifies
- `supabase/functions/send-oneshot-form/index.ts` (ajout DB insert + Discord webhook)
- Migration SQL (nouvelle table `oneshot_submissions`)

