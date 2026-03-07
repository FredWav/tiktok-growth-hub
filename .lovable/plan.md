

## Ajouter un event PostHog à chaque bouton/lien "Analyse Express"

### Boutons identifiés (7 emplacements)

1. **Header** (`src/components/layout/Header.tsx` l.9) — lien nav "Analyse Express"
2. **Footer** (`src/components/layout/Footer.tsx` l.30) — lien footer
3. **WavSocialScanPopup** (`src/components/WavSocialScanPopup.tsx` l.49) — bouton "Lancer mon analyse"
4. **AnalyseExpress** (`src/pages/AnalyseExpress.tsx` l.136) — bouton submit "Lancer l'analyse (11,90€)"
5. **AnalyseExpress** (`src/pages/AnalyseExpress.tsx` l.146) — lien "Retrouver mon analyse précédente"
6. **DiagnosticResult** (`src/pages/DiagnosticResult.tsx` l.153-154) — bouton "Lancer le Scan de mon compte" (offre EXPRESS)
7. **AnalyseExpressResult** (`src/pages/AnalyseExpressResult.tsx` l.232 et l.359) — boutons "Nouvelle analyse" (2 instances)
8. **NotFound** (`src/pages/NotFound.tsx` l.49) — lien "Analyse Express"

### Implémentation

Ajouter `trackPostHogEvent` (de `src/lib/posthog.ts`) à chaque clic avec un event name unique :

| Fichier | Event name | Properties |
|---------|-----------|------------|
| Header.tsx | `click_analyse_express_nav` | `{ location: "header" }` |
| Footer.tsx | `click_analyse_express_nav` | `{ location: "footer" }` |
| WavSocialScanPopup.tsx | `click_analyse_express_popup` | — |
| AnalyseExpress.tsx (submit) | `click_analyse_express_submit` | `{ username }` |
| AnalyseExpress.tsx (previous) | `click_analyse_express_previous` | — |
| DiagnosticResult.tsx | `click_analyse_express_diagnostic` | `{ offer: "EXPRESS" }` |
| AnalyseExpressResult.tsx | `click_analyse_express_new` | — |
| NotFound.tsx | `click_analyse_express_nav` | `{ location: "404" }` |

Pour Header et Footer, wraper les `<Link>` avec un `onClick` qui appelle `trackPostHogEvent`. Meme approche pour les autres composants.

