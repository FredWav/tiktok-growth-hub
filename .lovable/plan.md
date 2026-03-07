

## Plan : Mise en forme des sections "Mon parcours", "Ma philosophie" et transition icon "Ma façon de travailler"

### 1. Sections "Mon parcours" et "Ma philosophie" — Centrer les titres + mise en forme

**Fichier** : `src/pages/APropos.tsx`

- **Parcours (ligne 102-105)** : Changer `align="left"` en `align="center"` sur le `SectionHeader`
- **Parcours contenu (lignes 107-139)** : Structurer visuellement le texte avec des blocs distincts. Ajouter des séparateurs ou des mises en exergue sur les phrases clés (ex: "De là est née une méthode structurée" en `text-foreground font-semibold`). Centrer le wrapper `text-center` sur les paragraphes courts pour un rendu plus aéré.
- **Philosophie (ligne 146-148)** : Changer `align="left"` en `align="center"` sur le `SectionHeader`
- **Philosophie contenu (lignes 151-163)** : Centrer le texte (`text-center`), mettre en valeur la phrase forte "On ne poste pas pour exister. On poste pour convertir." avec un style plus impactant (taille plus grande, bordure gold à gauche ou quote style).

### 2. Section "Ma façon de travailler" — Transition smooth sur le background de l'icon

**Fichier** : `src/pages/APropos.tsx`

- Lignes 179 et 194 : Le `group-hover:from-primary/25 group-hover:to-primary/10` utilise des classes de gradient qui ne s'animent pas de manière fluide avec `transition-all` car Tailwind ne peut pas transitionner les stops de gradient CSS.
- **Fix** : Remplacer l'approche gradient par une approche avec deux couches superposées (un div de base + un div hover en `opacity-0 group-hover:opacity-100 transition-opacity duration-300`) ou plus simplement utiliser `bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300` au lieu du gradient, ce qui permet une vraie transition CSS fluide.

### Fichiers impactés

| Fichier | Modifications |
|---------|--------------|
| `src/pages/APropos.tsx` | Centrer titres Parcours/Philosophie, mise en forme texte, fix transition icon |

