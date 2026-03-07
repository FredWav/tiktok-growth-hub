

## Plan : Aligner le contenu à gauche + style citation pour Parcours et Philosophie

### Fichier : `src/pages/APropos.tsx`

**Section "Mon parcours" (lignes 107-142)** :
- Ligne 107 : remplacer `text-center` par `text-left`
- Envelopper tout le contenu texte dans un `blockquote` avec style citation (`border-l-4 border-primary/30 pl-6`)
- Ligne 121 : retirer `mx-auto` du séparateur (aligner à gauche aussi)

**Section "Ma philosophie" (lignes 154-168)** :
- Ligne 154 : remplacer `text-center` par `text-left`
- Envelopper le contenu dans un `blockquote` avec `border-l-4 border-primary/30 pl-6`
- Ligne 162 : retirer `mx-auto` et `max-w-md` du bloc citation existant (il est déjà dans le blockquote parent), garder juste le style de la phrase forte

Les titres `SectionHeader` restent centrés (`align="center"`).

