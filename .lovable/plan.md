

## Plan : Rééquilibrer le ScreenshotWall

### Problème
Le layout CSS `columns-3` répartit les images de haut en bas colonne par colonne. Si les images ont des hauteurs très différentes, une colonne peut être bien plus haute que les autres — d'où l'asymétrie visible.

### Solution
Remplacer le layout CSS `columns` par une distribution manuelle en colonnes équilibrées :

1. **Dans `ScreenshotWall.tsx`** : ajouter une logique qui distribue les screenshots dans 2 (mobile) ou 3 (desktop) colonnes en round-robin, puis rendre chaque colonne comme un `flex flex-col`. Cela garantit que les items sont répartis uniformément entre les colonnes au lieu d'être empilés séquentiellement dans une seule colonne avant de passer à la suivante.

```text
Avant (CSS columns) :        Après (round-robin) :
Col1  Col2  Col3             Col1  Col2  Col3
 1     4     7                1     2     3
 2     5     8                4     5     6
 3     6                      7     8
```

2. Utiliser un `grid grid-cols-2 md:grid-cols-3 gap-5` avec trois colonnes `flex flex-col gap-5`, chaque colonne recevant ses items en alternance.

3. Conserver le `max-w-4xl mx-auto` et le padding symétrique `px-4 sm:px-6 lg:px-8` conformément aux conventions du projet.

### Fichier modifié
- `src/components/ScreenshotWall.tsx`

