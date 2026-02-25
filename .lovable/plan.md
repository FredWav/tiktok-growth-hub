

## Plan : Adapter le code à la nouvelle structure de l'API WavSocialScan

### Diagnostic

L'API WavSocialScan a changé sa structure de réponse. Le code actuel s'attend à des champs plats (`health_score` comme nombre, `followers`, `engagement_rate`, etc.) mais l'API retourne maintenant des objets imbriqués :

```text
Ancienne structure (ce que le code attend) :
  { health_score: 85, followers: 150000, engagement_rate: 4.21, ... }

Nouvelle structure (ce que l'API retourne) :
  {
    account: { follower_count, following_count, video_count, like_count, ... },
    metrics: { avg_views, avg_likes, engagement_rate, ... },
    health_score: { total: 85, components: { engagement, consistency, ... } },
    persona: { niche_principale, forces, faiblesses, recommandations, ... },
    analysis: { shadowban_detected, viral_potential, best_posting_times, ... }
  }
```

### Modifications

**Fichier 1 : `supabase/functions/express-analysis/index.ts`**

- Ligne 65 : changer la condition de polling de `result.health_score !== undefined` à `result.health_score?.total !== undefined` pour détecter correctement quand l'analyse est prête

**Fichier 2 : `src/pages/AnalyseExpressResult.tsx`**

Adapter l'affichage aux nouveaux champs de l'API :

- **Health Score** (ligne 94, 160-164) : passer de `data.health_score` (nombre) à `data.health_score?.total` (nombre dans un objet)
- **Métriques** (lignes 170-188) : remapper les champs :
  - `data.followers` → `data.account?.follower_count`
  - `data.following` → `data.account?.following_count`
  - `data.total_likes` → `data.account?.like_count`
  - `data.total_videos` → `data.account?.video_count`
  - `data.engagement_rate` → `data.metrics?.engagement_rate`
  - `data.avg_views` → `data.metrics?.avg_views`
- **Persona** (lignes 191-196) : remapper de `data.persona` (string) vers un affichage structuré de `data.persona?.niche_principale`, `data.persona?.forces`, `data.persona?.faiblesses`
- **Recommandations** (lignes 199-211) : remapper de `data.recommendations` vers `data.persona?.recommandations`
- Ajouter l'affichage des **composantes du health score** (engagement, consistency, content_quality, growth_potential, technical_seo) sous le score global
- Ajouter les infos d'analyse : `best_posting_times`, `viral_potential`, `optimal_duration`

### Résultat attendu

La page de résultats affichera correctement toutes les données retournées par la nouvelle version de l'API, avec un affichage plus riche (composantes du score, conseils stratégiques, horaires optimaux).

