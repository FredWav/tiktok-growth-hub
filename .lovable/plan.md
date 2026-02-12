

## Plan : Refonte complete de l'offre VIP avec paiement Stripe et integration Discord

### 1. Mise a jour du contenu VIP (pages publiques)

#### `src/pages/Offres.tsx`
- Renommer "VIP a Vie" en "VIP"
- Nouveau subtitle : "Le club prive"
- Prix affiche : **99EUR/mois** avec mention "3 mois minimum"
- Selecteur de duree (3, 6 ou 12 mois) avec prix total dynamique :
  - 3 mois : 297EUR
  - 6 mois : 495EUR (1 mois offert)
  - 12 mois : 990EUR (2 mois offerts)
- Nouveaux avantages inclus :
  - 1 live par semaine en petit comite avec les membres VIP
  - Ressources nombreuses et regulierement mises a jour
  - Reponses et feedback 5/7 sur le serveur Discord
  - Acces au serveur Discord VIP prive
- CTA : "Souscrire" (lien vers page dediee ou checkout Stripe)

#### `src/pages/Home.tsx`
- Carte VIP : prix "A partir de 99EUR/mois", description mise a jour

#### `src/pages/Preuves.tsx`
- Renommer "VIP a Vie" en "VIP" (ligne 60)

---

### 2. Integration Stripe (paiement unique)

#### Pre-requis
- Activer l'integration Stripe sur le projet (collecte de la cle secrete)

#### Edge function : `supabase/functions/create-vip-checkout/index.ts`
- Recoit la duree choisie (3, 6 ou 12 mois)
- Cree une session Stripe Checkout avec le prix correspondant (297EUR, 495EUR ou 990EUR)
- Enregistre les metadata (user_id, duree, date de fin calculee)
- Retourne l'URL de checkout

#### Edge function : `supabase/functions/stripe-webhook/index.ts`
- Ecoute l'evenement `checkout.session.completed`
- Met a jour le booking en base (payment_status = 'paid')
- Calcule la date d'expiration du VIP
- Declenche l'attribution du role Discord (appel a l'edge function Discord)

#### Nouvelle page : `src/pages/VipCheckout.tsx`
- Page intermediaire avec recapitulatif de la formule choisie
- Bouton "Payer" qui appelle `create-vip-checkout` et redirige vers Stripe

#### Route dans `src/App.tsx`
- Ajout de `/offres/vip` pointant vers VipCheckout

---

### 3. Integration Discord (attribution/retrait automatique de role)

#### Pre-requis : secrets a configurer
- **DISCORD_BOT_TOKEN** : le token de ton bot Discord
- **DISCORD_GUILD_ID** : l'ID de ton serveur Discord
- **DISCORD_VIP_ROLE_ID** : l'ID du role VIP a attribuer

#### Migration base de donnees
Nouvelle table `vip_subscriptions` :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Cle primaire |
| user_id | uuid | Reference auth.users |
| client_id | uuid | Reference clients |
| stripe_session_id | text | ID session Stripe |
| duration_months | integer | 3, 6 ou 12 |
| starts_at | timestamptz | Date de debut |
| expires_at | timestamptz | Date d'expiration |
| discord_user_id | text | ID Discord du membre |
| discord_role_granted | boolean | Role attribue ou non |
| status | text | active, expired, cancelled |
| created_at | timestamptz | Date de creation |

Politiques RLS :
- Admin : acces complet
- Client : lecture de ses propres abonnements

#### Edge function : `supabase/functions/discord-role/index.ts`
- Actions : `grant` (attribuer le role) ou `revoke` (retirer le role)
- Utilise l'API Discord REST : `PUT /guilds/{guild_id}/members/{user_id}/roles/{role_id}` pour grant
- `DELETE /guilds/{guild_id}/members/{user_id}/roles/{role_id}` pour revoke
- Appelee par le webhook Stripe (grant) et par le cron d'expiration (revoke)

#### Edge function : `supabase/functions/check-vip-expiry/index.ts`
- Fonction appelee periodiquement (via pg_cron ou appel externe)
- Verifie les abonnements VIP expires (expires_at < now() AND status = 'active')
- Pour chaque abonnement expire :
  - Retire le role Discord
  - Met a jour le status en 'expired'

---

### 4. Collecte de l'ID Discord du membre

Pour attribuer le role, il faut connaitre l'ID Discord du membre. Deux options :

- **Option A** : Champ "ID Discord" ou "Pseudo Discord" dans le formulaire de checkout/profil client. Le membre devra fournir son ID Discord (un nombre). Simple a implementer.
- **Option B** : OAuth Discord pour lier automatiquement le compte. Plus complexe mais plus fiable.

Je recommande l'**Option A** pour commencer : un champ dans le formulaire de checkout ou le client entre son ID Discord (avec des instructions pour le trouver).

---

### 5. Flux complet

```text
Utilisateur sur /offres
       |
       v
Choisit VIP + duree (3/6/12 mois)
       |
       v
Page /offres/vip : recapitulatif + champ Discord ID
       |
       v
Clic "Payer" --> Edge function create-vip-checkout
       |
       v
Redirection Stripe Checkout (297/495/990 EUR)
       |
       v
Paiement reussi --> Stripe webhook
       |
       v
Webhook :
  1. Cree/met a jour booking (paid)
  2. Cree vip_subscription (active, expires_at calcule)
  3. Appelle discord-role (grant)
       |
       v
Role VIP attribue sur Discord

--- Plus tard (expiration) ---

check-vip-expiry (cron)
       |
       v
Trouve abonnements expires
       |
       v
Appelle discord-role (revoke) pour chacun
       |
       v
Role VIP retire sur Discord
```

---

### 6. Resume des fichiers

| Fichier | Action |
|---------|--------|
| `src/pages/Offres.tsx` | Modifier - refonte section VIP |
| `src/pages/Home.tsx` | Modifier - carte VIP |
| `src/pages/Preuves.tsx` | Modifier - label VIP |
| `src/pages/VipCheckout.tsx` | Creer - page checkout VIP |
| `src/App.tsx` | Modifier - route /offres/vip |
| `supabase/functions/create-vip-checkout/index.ts` | Creer |
| `supabase/functions/stripe-webhook/index.ts` | Creer |
| `supabase/functions/discord-role/index.ts` | Creer |
| `supabase/functions/check-vip-expiry/index.ts` | Creer |
| Migration SQL | Table vip_subscriptions + RLS |

### 7. Secrets a configurer
- Cle secrete Stripe (via integration Stripe Lovable)
- DISCORD_BOT_TOKEN
- DISCORD_GUILD_ID
- DISCORD_VIP_ROLE_ID

