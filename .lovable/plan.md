

## Plan : Compléter le système de tracking Zero-Party Data + Dashboard Marketing

### État actuel

La majorité du travail a été faite dans les itérations précédentes. Voici ce qui **reste à faire** :

### 1. Migration DB — Ajouter `posthog_id`

Ajouter une colonne `posthog_id text` nullable aux 3 tables : `wav_premium_applications`, `diagnostic_leads`, `oneshot_submissions`.

### 2. `src/lib/posthog.ts` — Exporter `getPostHogId()`

Ajouter une fonction qui retourne `posthog.get_distinct_id()` si PostHog est initialisé, sinon `null`.

### 3. `src/lib/tracking.ts` — Ajouter `utm_medium`

`captureUtmParams()` capture déjà `utm_source` et `utm_campaign`. Ajouter `utm_medium` dans le même pattern localStorage.

### 4. `src/pages/WavPremiumApplication.tsx` — Ajouter `conversion_trigger` + `posthog_id`

- Ajouter un champ "Quel contenu t'a décidé aujourd'hui ?" dans le bloc attribution
- Envoyer `posthog_id` via `getPostHogId()` dans le payload insert + notify-application

### 5. `src/pages/OneShotSuccess.tsx` — Envoyer `posthog_id`

Ajouter `posthog_id` dans le body envoyé à `send-oneshot-form`.

### 6. Admin Marketing — Nouvelle page

**`src/pages/admin/Marketing.tsx`** : page divisée en deux colonnes.

- **Gauche — Générateur UTM** : formulaire local (URL, Source, Medium, Campagne) → affiche l'URL générée + bouton Copier. Aucun appel Supabase.
- **Droite — Derniers leads** : tableau fusionnant `wav_premium_applications` (offre "Wav Premium") et `diagnostic_leads` complétés (offre "Diagnostic"), triés par date. Colonnes : Date, Nom, Offre, Source, Follower Since, CA Actuel, PostHog ID (lien cliquable vers `https://us.posthog.com/project/…/person/{id}`).

**`src/components/layout/AdminLayout.tsx`** : ajouter un lien "Marketing" avec icône `BarChart3` pointant vers `/admin/marketing`.

**`src/App.tsx`** : ajouter la route `/admin/marketing` protégée admin.

### 7. Edge Functions — Ajouter `posthog_id`

- `notify-application/index.ts` : extraire `posthog_id` du body, l'ajouter comme champ dans l'embed Discord.
- `send-oneshot-form/index.ts` : idem, extraire et ajouter dans Discord + email HTML.

---

**Fichiers modifiés** : 8 fichiers + 1 nouveau + 1 migration SQL. Aucune dépendance ajoutée.

