

# One Shot : formulaire pre-reservation + envoi par email

## Objectif

Apres le paiement Stripe, le client remplit un formulaire avec ses infos avant d'acceder au lien Calendly. Les informations collectees sont envoyees par email a fredwavcm@gmail.com.

## Flow utilisateur

```text
Paiement Stripe OK
       |
       v
Page de succes - Etape 1 : Formulaire
  (Nom, Email, WhatsApp, Compte TikTok, Objectifs)
       |
       v
Soumission du formulaire
       |
       v
Envoi email a fredwavcm@gmail.com (via fonction backend)
       |
       v
Page de succes - Etape 2 : Lien Calendly affiche
  + message contact si horaires impossibles
```

## Ce qui sera fait

### 1. Service d'envoi d'emails

Il faut un service d'envoi d'emails. **Resend** est le plus simple a integrer. Il faudra :
- Creer un compte gratuit sur [resend.com](https://resend.com) (100 emails/jour gratuits)
- Recuperer la cle API
- La stocker comme secret du projet (`RESEND_API_KEY`)

### 2. Fonction backend `send-oneshot-form`

Nouvelle fonction qui :
- Recoit les donnees du formulaire (nom, email, whatsapp, tiktok, objectifs)
- Envoie un email formate a fredwavcm@gmail.com avec toutes les infos
- Utilise Resend pour l'envoi
- Pas d'authentification requise (le client vient de payer)

### 3. Mise a jour de `OneShotSuccess.tsx`

Transformer la page en 2 etapes :
- **Etape 1** : Formulaire avec les champs suivants :
  - Nom / Prenom (obligatoire)
  - Email (obligatoire, validation format)
  - WhatsApp (obligatoire, numero de telephone)
  - Compte TikTok (obligatoire, @handle ou lien)
  - Objectifs / Situation (obligatoire, textarea)
- **Etape 2** (apres soumission) : Message de confirmation + bouton Calendly + message contact

Validation cote client avec zod + react-hook-form (deja installes).

### 4. Configuration

- Ajouter `send-oneshot-form` dans `supabase/config.toml` avec `verify_jwt = false`

## Details techniques

- Fichiers crees :
  - `supabase/functions/send-oneshot-form/index.ts`
- Fichiers modifies :
  - `src/pages/OneShotSuccess.tsx` (ajout formulaire 2 etapes)
  - `supabase/config.toml` (ajout config fonction)
- Secret necessaire : `RESEND_API_KEY` (a fournir apres creation du compte Resend)
- Validation : zod schema avec tous les champs obligatoires
- Email envoye au format HTML lisible avec toutes les infos du client

