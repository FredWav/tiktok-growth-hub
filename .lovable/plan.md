

## Plan : Tracking d'attribution Zero-Party Data

### 1. Migration DB — Nouvelles colonnes

**Table `wav_premium_applications`** : ajouter `origin_source text`, `follower_since text`, `conversion_trigger text`, `current_revenue text`, `revenue_goal text`. Supprimer `budget_confirmed boolean`.

**Table `diagnostic_leads`** : ajouter `origin_source text`, `follower_since text`, `conversion_trigger text`.

**Table `oneshot_submissions`** : ajouter `origin_source text`, `conversion_trigger text`.

### 2. `src/lib/tracking.ts` — Capture UTM

Ajouter une fonction `captureUtmParams()` qui lit `utm_source` et `utm_campaign` depuis `window.location.search` et les stocke dans `localStorage` sous les clés `utm_source` et `utm_campaign`. Ajouter `getStoredUtmSource()` qui retourne une string formatée (ex: "TikTok (campagne X)") ou `""`.

Appeler `captureUtmParams()` dans `App.tsx` au montage.

### 3. `src/pages/WavPremiumApplication.tsx` — Formulaire enrichi

- Remplacer le champ `budget_confirmed` (checkbox) par deux champs texte : `current_revenue` ("Ton CA actuel ?") et `revenue_goal` ("Ton objectif de CA à 6 mois ?")
- Ajouter `origin_source` (input texte, pré-rempli via `getStoredUtmSource()`) : "Comment m'as-tu découvert ?"
- Ajouter `follower_since` (select : "Moins d'1 mois", "1-3 mois", "3-6 mois", "6+ mois", "Je ne te suivais pas") : "Depuis combien de temps me suis-tu ?"
- Supprimer le bloc budget notice + checkbox
- Mettre à jour le schéma zod, les defaultValues, et le payload `insert` + `notify-application`

### 4. `src/pages/OneShotSuccess.tsx` — Mini-formulaire attribution

- Ajouter deux champs au schéma zod : `origin_source` (optionnel) et `conversion_trigger` (optionnel)
- Les afficher juste avant le bouton submit, dans un bloc séparé visuellement ("Pour mieux te servir")
- `origin_source` pré-rempli via `getStoredUtmSource()`
- Passer ces champs dans le body de `send-oneshot-form`

### 5. `src/pages/AnalyseExpressResult.tsx` — Alerte régularité

- Après la section `RegularityBreakdown`, si `pubPattern?.consistency_score < 60`, afficher un bloc d'alerte stylisé (bg orange/ambre) avec le message "⚠️ Ta régularité freine ton acquisition. On règle ça en 1h30 ?" et un bouton CTA vers `/one-shot`

### 6. Edge Functions — Notifications enrichies

**`supabase/functions/notify-application/index.ts`** :
- Extraire `current_revenue`, `revenue_goal`, `origin_source`, `follower_since` du body
- Ajouter 4 champs dans l'embed Discord : "💰 CA actuel", "🎯 Objectif CA", "📍 Source", "⏳ Follower depuis"
- Supprimer le champ "💰 Budget confirmé"

**`supabase/functions/send-oneshot-form/index.ts`** :
- Extraire `origin_source` et `conversion_trigger` du body
- Ajouter 2 champs dans l'embed Discord : "📍 Source" et "🔥 Déclencheur"
- Ajouter 2 lignes dans le tableau HTML email

### 7. `src/integrations/supabase/types.ts`

Ce fichier est auto-généré et ne doit pas être modifié manuellement. Après la migration, les types seront régénérés automatiquement. En attendant, les `as any` casts existants sur les inserts seront maintenus.

---

**Fichiers modifiés** : 7 fichiers + 1 migration SQL
**Nouvelles dépendances** : aucune

