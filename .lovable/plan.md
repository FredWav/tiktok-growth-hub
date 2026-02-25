

## Plan : Afficher toutes les données API et rendre le markdown

L'API retourne beaucoup de données qui ne sont pas affichées actuellement. Voici ce qui manque et comment l'ajouter.

### Données manquantes à afficher

| Donnée | Source dans l'API | Actuellement affiché |
|--------|-------------------|---------------------|
| Avatar + display_name + bio | `data.account.avatar_url`, `display_name`, `bio` | Non |
| Niche détectée | `data.account.detected_niche` | Non |
| Verified badge | `data.account.verified` | Non |
| Métriques médianes (vues, likes, comments, saves, shares) | `data.account.median_*` | Non |
| Moyennes détaillées (likes, comments, saves, shares) | `data.account.avg_*` | Non |
| Top hashtags | `data.account.top_hashtags` | Non |
| AI Insights (markdown complet) | `data.account.ai_insights` | Non |
| Health score labels + status | `healthComponents.*.label`, `*.status` | Non |
| Priority actions | `data.health_score.priority_actions` | Non |
| Overall status | `data.health_score.overall_status` | Non |
| Meilleurs horaires (depuis persona) | `data.persona.style_contenu.publication_pattern.best_times` | Non |
| Recommendations de publication | `data.persona.style_contenu.publication_pattern.recommendations` | Non |
| Consistency score | `data.persona.style_contenu.publication_pattern.consistency_score` | Non |
| Regularity breakdown | `data.persona.style_contenu.publication_pattern.regularity_details.tiktok_breakdown` | Non |
| Publication frequency | `data.persona.style_contenu.publication_pattern.publication_frequency` | Non |

### Modifications dans `src/pages/AnalyseExpressResult.tsx`

**1. Profil header avec avatar**
- Ajouter en haut des résultats : avatar circulaire, display_name, bio, niche détectée, badge vérifié

**2. Grille de métriques étendue**
- Ajouter : avg_likes, avg_comments, avg_saves, avg_shares, median_views, median_likes
- Organiser en 2 grilles : "Moyennes" et "Médianes"

**3. Labels dans les ScoreBars**
- Afficher le `label` (ex: "Bon (>5%)") et le `status` à côté de chaque barre de score

**4. Priority actions + overall status**
- Ajouter sous le health score global

**5. Top Hashtags**
- Afficher les hashtags sous forme de badges/chips

**6. Meilleurs horaires de publication**
- Afficher les top 5 créneaux depuis `persona.style_contenu.publication_pattern.best_times` avec jour + heure traduits en français

**7. Régularité détaillée**
- Afficher le `tiktok_breakdown` (5 sous-scores avec détails)
- Afficher les `recommendations` de publication

**8. AI Insights — rendu markdown**
- Parser le markdown `data.account.ai_insights` et le rendre en HTML stylé
- Utiliser une fonction simple de rendu markdown (pas de lib externe) : convertir `#`, `##`, `###`, `**`, `-`, `\n` en éléments HTML/JSX
- Afficher dans une section collapsible "Analyse détaillée" pour ne pas surcharger la page

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/pages/AnalyseExpressResult.tsx` | Ajout de toutes les sections listées ci-dessus + fonction de rendu markdown simple |

### Détails techniques

- Fonction `renderMarkdown(md: string)` : convertit le markdown en JSX en splittant par lignes et en détectant les patterns `#`, `##`, `###`, `**text**`, `- item`
- Les AI Insights seront dans un `Collapsible` (déjà installé) pour garder la page lisible
- Les jours (0-6) seront traduits : `["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]`
- Les heures seront formatées en `HH:00`

