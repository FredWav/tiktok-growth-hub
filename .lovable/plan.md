## Objectif
Lancer une analyse réelle sur @fredwav via l'API WavStats v2, capturer le payload brut complet, puis corriger les écarts entre ce payload et ce qu'attend le générateur PDF (`pdf-html-generator.ts` + `pdf-data-mapper.ts`).

## Étapes

### 1. Lancer l'analyse et capturer le payload brut
- Appeler `POST https://wavstats.com/api/v1/accounts/fredwav/analyze` avec `WAV_SOCIAL_SCAN_API_KEY` (via un script curl côté sandbox pour éviter d'écrire en DB).
- Poller `GET /jobs/{jobId}` jusqu'à `status=completed`.
- Sauvegarder la réponse complète dans `/mnt/documents/wavstats-fredwav-raw.json`.
- Passer cette réponse dans `normalizeWavStatsResult()` (via un petit runner Deno local) pour produire aussi le `result_data` normalisé → `/mnt/documents/wavstats-fredwav-normalized.json`.

Note : si l'API renvoie 403 `API_PLAN_REQUIRED` (comme récemment sur d'autres comptes), on s'arrête ici et on remonte le blocage plan Agency — pas de contournement possible côté code.

### 2. Auditer le mapping PDF avec le vrai payload
Comparer le JSON normalisé à ce que `mapAccountDataForPDF()` puis `pdf-html-generator.ts` consomment. Points connus à vérifier :

| Zone PDF | Source attendue | Écart possible v2 |
|---|---|---|
| Cover / score global | `pdfData.health_score` (number) | Normalizer renvoie `{ total, components }` — `health_score` reste un objet, `extractHealthScore` gère les deux mais `pdfData.health_score` est typé `number` |
| Résumé exécutif — persona | `pdfData.persona.{niche_principale,forces,faiblesses}` | Rien ne peuple `persona` : à dériver de `ai_analysis.strengths[].title` / `improvements[].title` + `account.detected_niche` |
| Meilleurs créneaux | `pdfData.best_times[{day,hour,avg_views}]` | v2 fournit `publication_pattern.best_hours` / `best_days` sans `avg_views` — mapping absent |
| Régularité détaillée | `pdfData.regularity_breakdown` | v2 ne fournit pas ce breakdown — soit dériver de `publication_pattern` (consistency + max_gap), soit masquer la section |
| Fréquence publi | `pdfData.publication_frequency.{daily_avg, weekly_pattern}` | v2 fournit `frequency` (string ex. "3-5/semaine") — mapping absent |
| Shadowban | `pdfData.shadowban_status` (string FR) | v2 : `shadowban_analysis.{risk_level,diagnosis,percentage}` — `extractShadowbanStatus` en tient compte, à valider |
| Top hashtags | `pdfData.popular_hashtags` | OK via `top_hashtags` |
| AI insights (markdown) | `account.ai_insights` | Généré par `buildAiInsightsMarkdown` — vérifier rendu markdown → HTML |
| Recent videos (top vidéos) | `accountData.recent_videos` pour hashtag extraction | OK |
| Métriques | `stats.*` | OK (moyennes + médianes déjà mappées) |

### 3. Patcher les 2 fichiers pour combler les manques

**`src/lib/pdf-data-mapper.ts`** — enrichir `mapAccountDataForPDF` :
- Accepter en argument le payload normalisé complet (`normalized`), pas juste `accountData`, pour lire `health_score`, `publication_pattern`, `ai_analysis`.
- Construire `persona` à partir de :
  - `niche_principale` ← `account.detected_niche`
  - `forces` ← `ai_analysis.strengths[].title` (top 4)
  - `faiblesses` ← `ai_analysis.improvements[].title` (top 4)
- Construire `best_times` à partir de `publication_pattern.best_hours` en croisant avec `weekly_distribution` pour estimer `avg_views` (ou fallback : masquer la barre et n'afficher que jour+heure).
- Construire `publication_frequency` :
  - `weekly_pattern` ← `publication_pattern.frequency`
  - `daily_avg` ← estimé depuis `weekly_distribution` si présent, sinon undefined
- `consistency_score` ← `publication_pattern.consistency_score`
- `recommendations` ← `ai_analysis.actionPlan[].text` (top 3) si `publication_pattern.recommendations` absent
- `regularity_breakdown` : si absent côté v2, ne rien fournir (le générateur masque déjà la section quand null)
- Corriger `pdfData.health_score` : exposer le **nombre** (`.total`) pour la cover, garder l'objet pour `generateHealthScoreDetailHTML` via un nouveau champ `health_score_detail`.

**`src/lib/pdf-html-generator.ts`** — ajustements légers :
- Passer `pdfData.health_score_detail` (nouveau) à `generateHealthScoreDetailHTML` au lieu de `pdfData.health_score`.
- Dans `generateBestTimesHTML`, gérer le cas `avg_views = 0` (masquer la barre au lieu d'afficher barre vide).
- Rien d'autre à toucher visuellement.

### 4. Trouver les call sites de `mapAccountDataForPDF`
Chercher qui appelle le mapper aujourd'hui et adapter la signature pour lui passer le payload normalisé complet (une seule fois, côté résultat Analyse Express).

### 5. Vérifier
- Re-générer un PDF de test avec le payload fredwav capturé (via un petit script Node qui appelle le mapper + un moteur HTML→PDF simulé, ou en rechargeant `/analyse-express/result?session_id=…` sur un vrai enregistrement).
- Contrôler visuellement les sections : cover score, résumé exécutif, persona, best times, fréquence, shadowban, IA.
- Sauvegarder le PDF final dans `/mnt/documents/` pour inspection.

## Livrables
- `/mnt/documents/wavstats-fredwav-raw.json` (payload API brut)
- `/mnt/documents/wavstats-fredwav-normalized.json` (après `normalizeWavStatsResult`)
- Diff sur `src/lib/pdf-data-mapper.ts` et `src/lib/pdf-html-generator.ts`
- PDF de test rendu

## Hors scope
- Pas de changement du normalizer edge (`_shared/wavstats-normalizer.ts`) — contrat déjà stable.
- Pas de refonte visuelle du PDF, uniquement combler les données manquantes.
- Pas de modification des composants React d'affichage (`src/components/express-result/*`).
