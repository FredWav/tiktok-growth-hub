

## Plan : Afficher l'analyse IA directement (sans collapsible) et corriger le mobile

### Problème
L'analyse IA (`ai_insights`) est dans un `Collapsible` fermé par défaut → invisible sur mobile car l'utilisateur ne pense pas à cliquer dessus.

### Modification : `src/pages/AnalyseExpressResult.tsx` (lignes 307-322)

Remplacer le `Collapsible` par une section toujours visible :
- Supprimer `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` et le state `insightsOpen`
- Afficher directement le contenu markdown dans une card avec titre `📊 Analyse détaillée (IA)` et le `MarkdownRenderer` toujours visible
- Supprimer les imports `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`, `ChevronDown` et le state `insightsOpen`

