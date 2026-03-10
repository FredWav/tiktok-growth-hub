

## Plan : Corriger les confusions "Analyse Express" ↔ "One Shot"

### Problème

Sur 3 pages, le One Shot (179€, session live 1h30) est appelé "Analyse Express" ou "One Shot (Analyse Express)" dans les titres et CTA. L'Analyse Express est un produit séparé (11,90€, audit auto 3 min).

### Corrections

**1. `src/pages/Home.tsx`** (lignes 77, 78, 87)
- `"One Shot (Analyse Express)"` → `"One Shot"`
- `"Diagnostic + plan d'action"` → `"Session stratégique 1h30"`
- `"Réserver mon Analyse Express (1h30)"` → `"Réserver mon One Shot (179€)"`

**2. `src/pages/Offres.tsx`** (lignes 50, 51, 71)
- `"One Shot (Analyse Express)"` → `"One Shot"`
- `"Diagnostic + plan d'action"` → `"Session stratégique 1h30"`
- `"Réserver mon Analyse Express (1h30)"` → `"Réserver mon One Shot (179€)"`

**3 fichiers modifiés, 6 lignes changées. Aucun autre fichier impacté** — les pages OneShot.tsx, Preuves.tsx, ExitIntentPopup.tsx, Header, Footer sont déjà correctes.

