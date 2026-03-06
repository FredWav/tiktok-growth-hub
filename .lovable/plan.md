

## Diagnostic : compatibilite avec le callback API

En comparant la structure API que tu viens de partager avec le code des Edge Functions, voici ce qui fonctionne et ce qui ne fonctionne pas :

### Ce qui marche

| Champ | Code actuel | Verdict |
|-------|------------|---------|
| `ai_insights` (objet) | `job.result?.account?.ai_insights` puis `!aiInsights` | OK — un objet truthy passe le check |
| `status`, `progress`, `current_step` | Lecture directe | OK |
| `error` (cas failed) | `job.error` | OK |

### Ce qui ne marche PAS

| Champ | Code actuel | Probleme |
|-------|------------|----------|
| `health_score` | `job.result?.health_score ?? job.result?.score` puis `typeof healthScore === "number"` | **L'API retourne un objet `{ total: 74, components: {...} }`, pas un nombre.** Le check `typeof === "number"` echoue → stocke `null` |

C'est le seul bug. Le `health_score` est present dans la reponse mais ignore a cause du type check.

### Correction

**2 fichiers a modifier, meme changement dans chacun :**

**`supabase/functions/express-analysis-status/index.ts`** (~ligne 135) et **`supabase/functions/check-express-job/index.ts`** (~ligne 90) :

Remplacer :
```javascript
const healthScore = job.result?.health_score ?? job.result?.score ?? null;
// ...
health_score: typeof healthScore === "number" ? healthScore : null,
```

Par :
```javascript
const hs = job.result?.health_score ?? job.result?.account?.health_score;
const healthScore = typeof hs === "object" && hs !== null ? hs.total : (typeof hs === "number" ? hs : null);
// ...
health_score: typeof healthScore === "number" ? healthScore : null,
```

Aucun autre changement necessaire. Le reste du code gere correctement la structure de callback.

