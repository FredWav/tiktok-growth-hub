

## Diagnostic

L'erreur React #31 dit : **"Objects are not valid as a React child (object with keys {label, score, status})"**.

La cause est claire : l'API retourne `health_score.components.engagement` comme un **objet** `{ label, score, status }`, pas un simple nombre. Le code passe cet objet directement à `ScoreBar` qui attend un `number` pour `score`.

Exemple de la réponse API :
```json
"engagement": { "label": "Bon (>5%)", "score": 70, "status": "good" }
```

Le code actuel (ligne 247) :
```tsx
<ScoreBar score={healthComponents.engagement} />  // ← passe l'objet entier
```

Il faut passer `.score` :
```tsx
<ScoreBar score={healthComponents.engagement.score} />
```

Deuxième problème : `data.metrics` contient des zéros (engagement_rate: 0, avg_views: 0). Les vraies métriques sont dans `data.account` (engagement_rate: 5.93, avg_views: 8037). Il faut lire depuis `data.account` en priorité.

---

## Corrections

### Fichier : `src/pages/AnalyseExpressResult.tsx`

**1. ScoreBar — extraire `.score` de chaque composant (lignes 246-260)**

Changer :
- `healthComponents.engagement` → `healthComponents.engagement.score`
- `healthComponents.consistency` → `healthComponents.consistency.score`
- `healthComponents.content_quality` → `healthComponents.content_quality.score`
- `healthComponents.growth_potential` → `healthComponents.growth_potential.score`
- `healthComponents.technical_seo` → `healthComponents.technical_seo.score`

**2. Métriques — lire depuis `data.account` au lieu de `data.metrics` (lignes 279-284)**

- Engagement rate : `data.account.engagement_rate` au lieu de `data.metrics.engagement_rate`
- Vues moyennes : `data.account.avg_views` au lieu de `data.metrics.avg_views`

**3. Null-check sur viral_potential (ligne 290)**

L'API retourne `viral_potential: null`. La condition `!== undefined` laisse passer `null`. Changer en `!= null` (ou `!== undefined && !== null`).

