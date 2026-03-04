

## Plan : Masquer le VIP + Optimiser le formulaire Wav Premium

### 1. `src/pages/Offres.tsx`

- **Retirer le VIP du `profileSelector`** : ne garder que les 2 premiers items (One Shot, Wav Premium)
- **Commenter l'objet VIP dans le tableau `offers`** (lignes 79-110) pour qu'il ne s'affiche plus
- **Adapter les textes** : "Trois niveaux" → "Deux accompagnements", "trois types de profils" → "deux types de profils"
- **Retirer le VIP du schema SEO** (`itemListElement`)
- Aucun fichier backend supprimé, routes VIP conservées

### 2. `src/pages/WavPremiumApplication.tsx`

- **Rendre `current_revenue` et `revenue_goal` obligatoires** dans le schema Zod (retirer `.optional().or(z.literal(""))`, ajouter `.min(1, "...")`)
- **Mettre à jour les labels** : "Ton CA actuel ?" → "Quel est ton CA mensuel actuel ?" et "Ton objectif de CA à 6 mois ?" → "Quel est ton objectif de CA mensuel d'ici 6 mois ?"
- Ajouter `*` aux labels pour indiquer les champs obligatoires
- Le formulaire ne contient déjà aucune mention de prix (987€) ni de `budget_confirmed` — rien à supprimer

**Fichiers modifiés** : 2 (`Offres.tsx`, `WavPremiumApplication.tsx`). Aucune migration DB, aucun fichier supprimé.

