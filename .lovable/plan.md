

## Plan : CRM auto-prospect + livraison Analyse Express par email

### 1. Migration DB — Ajouter `email` à `express_analyses`

Ajouter une colonne `email text` nullable à la table `express_analyses`.

### 2. Frontend — Champ email dans `AnalyseExpress.tsx`

- Ajouter un state `email` et un champ Input "Adresse email" obligatoire sous le champ username
- Passer `email` dans le body de `create-express-checkout`
- Afficher l'email dans le modal de confirmation

### 3. Edge Function `create-express-checkout` — `customer_email`

- Extraire `email` du body
- Ajouter `customer_email: email` dans `stripe.checkout.sessions.create()`
- Stocker l'email dans `metadata` pour le récupérer plus tard

### 4. Edge Function `express-analysis` — Sauvegarder l'email

- Lors de l'insert dans `express_analyses`, récupérer l'email depuis `session.metadata.email` ou `session.customer_email` et le persister

### 5. Frontend — UX asynchrone dans `AnalyseExpressResult.tsx`

- Modifier la section loading : remplacer le spinner d'attente active par un message "Ton analyse est en cours (~2 min). Tu peux fermer cette page, ton rapport te sera envoyé par email."
- Conserver le polling en arrière-plan pour ceux qui restent sur la page (résultats s'affichent si prêts)

### 6. Edge Function `express-analysis-status` — Envoi email à la complétion

- Quand `job.status === "completed"` et les données sont sauvées :
  - Récupérer l'email depuis `express_analyses` (colonne `email`)
  - Construire un email HTML avec lien vers `https://fredwav.lovable.app/analyse-express/result?session_id={session_id}`
  - Envoyer via nodemailer (SMTP OVH, même config que `send-oneshot-form`)

### 7. CRM auto-prospect — Logique d'upsert dans les Edge Functions

Créer une fonction utilitaire `upsertProspect(supabase, { email, name?, tiktok?, source? })` utilisable dans les 3 fonctions :

- **`express-analysis-status`** (à la complétion) : upsert avec email + tiktok du client
- **`send-oneshot-form`** : upsert avec email + nom + tiktok
- **`notify-application`** : pas de changement (les candidatures Wav Premium ne passent pas par `clients` car ce sont des prospects à qualification manuelle)

**Logique d'upsert** : Chercher dans `profiles` par email (via `auth.users`). Si pas trouvé, on ne crée PAS de user auth (pas de sens pour un achat ponctuel). A la place, on insère/met à jour directement dans `clients` en utilisant un user_id "system" ou on crée une table dédiée `prospects` — MAIS la table `clients` requiert un `user_id` (FK vers auth). 

**Problème identifié** : La table `clients` a un champ `user_id uuid NOT NULL` qui référence un user authentifié. On ne peut pas y insérer un prospect sans compte. Deux options :

- **Option A** : Rendre `user_id` nullable dans `clients` pour permettre les prospects sans compte
- **Option B** : Créer une table `prospects` séparée (email, name, tiktok, source, offer, created_at) et adapter l'admin

Je recommande **Option A** (rendre `user_id` nullable) car c'est le plus simple et le champ `status = 'prospect'` distingue déjà les prospects des clients actifs. Il faudra mettre à jour la RLS pour autoriser les inserts admin-only sans user_id.

### 8. Admin — Renommer "Clients" en "Prospects & Clients"

Dans `AdminLayout.tsx`, changer le label du navItem de "Clients" à "Prospects & Clients".

---

**Fichiers modifiés** : `AnalyseExpress.tsx`, `AnalyseExpressResult.tsx`, `create-express-checkout/index.ts`, `express-analysis/index.ts`, `express-analysis-status/index.ts`, `send-oneshot-form/index.ts`, `AdminLayout.tsx` + 1 migration SQL

**Clarification nécessaire** : l'upsert CRM dépend de la contrainte `user_id NOT NULL` sur `clients`.

