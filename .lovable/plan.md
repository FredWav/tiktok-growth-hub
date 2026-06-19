# Migration Analyse Express - WavStats API v2.0.0

L'API source change : nouveau base URL `https://wavstats.com/api/v1` et nouveau format de payload (`account`, `averages`, `healthScore`, `aiAnalysis`, `topVideos`, `publicationPattern`, `shadowbanAnalysis`, `hashtags`). Plus de `ai_insights` markdown ni de `persona` legacy : à la place une structure `aiAnalysis` riche (summary, strengths, improvements, actionPlan, strategy3_6, hashtagStrategy, bioOptimized, profilePhoto, gridVisual).

## Stratégie

Pour minimiser la casse, on **normalise côté Edge Function** vers une forme `result_data` enrichie (compatible avec l'ancien rendu + nouveaux champs). L'écran de résultat est mis à jour pour afficher les nouveaux blocs (forces / améliorations / plan d'action structuré, top vidéos, shadowban, bio optimisée, stratégie 3-6 mois).

## Changements

### 1. Edge Functions - base URL + auth
Remplacer dans les 6 fonctions :
- `express-analysis`
- `express-analysis-status`
- `manual-express-analysis`
- `retry-express-analysis`
- `check-express-job`
- `reconcile-express-analyses`

```
const API_BASE = "https://wavstats.com/api/v1";
```
(header `X-API-Key` inchangé, `WAV_SOCIAL_SCAN_API_KEY` reste le nom du secret côté Lovable)

### 2. Normalisation dans `express-analysis-status`
Quand `job.status === "completed"`, mapper `job.result` (nouveau format) vers `result_data` :
- `account.username/display_name/avatar_url/bio/verified/detected_niche` ← `result.account.*`
- `account.follower_count/video_count/like_count/engagement_rate/save_rate` ← `result.account.*`
- `account.avg_views/avg_likes/...` ← `result.averages.*`
- `account.median_views/...` ← `result.averages.median*`
- `account.top_hashtags` ← `result.hashtags`
- `account.recent_videos` ← `result.topVideos` (mappés id/description/views/likes/comments/shares/saves/cover_url)
- `account.shadowban_analysis` ← `result.shadowbanAnalysis` (snake_cased)
- `health_score` ← `result.healthScore` (avec components convertis en `{score,label,status}`)
- `ai_analysis` (nouveau) ← `result.aiAnalysis` (gardé structuré)
- `ai_insights` (legacy markdown) ← généré depuis `aiAnalysis.summary + strengths + improvements + actionPlan` pour conserver le rendu existant et le PDF
- `publication_pattern` ← `result.publicationPattern` (best_days/best_hours/frequency/consistency_score)

Stocker en DB sous `result_data` et renvoyer tel quel au front. `healthScore` extrait pour la colonne `health_score`.

### 3. Frontend - `AnalyseExpressResult.tsx`
- Lire `data.ai_analysis` (nouveau) et `data.health_score`
- Garder le rendu legacy (Profile, HealthScore, Metrics, Hashtags, AI markdown, PDF) pour compat
- Ajouter 4 nouveaux blocs si `ai_analysis` présent :
  - **Forces / Axes d'amélioration** (cartes avec title + description)
  - **Plan d'action 30 jours** (text + metric + impact/effort badges)
  - **Stratégie 3-6 mois** (text + metric + timeline)
  - **Bio optimisée** (3 propositions sélectionnables/copiables) + **Stratégie hashtags** (current vs suggested)
- Ajouter section **Top vidéos** (carte horizontale avec cover + stats)
- Ajouter **Shadowban analysis** (badge risk_level + diagnosis)

### 4. Composants
Nouveaux fichiers (petits, focalisés) :
- `src/components/express-result/AIAnalysisSection.tsx` (forces/améliorations/plan/stratégie/bio/hashtags)
- `src/components/express-result/TopVideosSection.tsx`
- `src/components/express-result/ShadowbanSection.tsx`

### 5. PDF
Le PDF actuel consomme `ai_insights` markdown : il continue de fonctionner grâce au markdown généré depuis `aiAnalysis`. Pas de changement nécessaire dans `pdf-html-generator.ts` / `pdf-data-mapper.ts`.

### 6. Hors scope
- Pas de migration DB (la colonne `result_data` est `jsonb` et accepte la nouvelle forme)
- Pas de changement des webhooks Discord / emails / Stripe
- `_rawMarkdown` ignoré (debug uniquement)

## Fichiers touchés
- 6 edge functions (URL)
- `supabase/functions/express-analysis-status/index.ts` (+ normalizer)
- `src/pages/AnalyseExpressResult.tsx`
- 3 nouveaux composants `src/components/express-result/*`
