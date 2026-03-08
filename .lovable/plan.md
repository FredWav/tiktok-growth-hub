

## Plan : Supprimer les temoignages hardcodes et agrandir le ScreenshotWall

### Constat

La page Home.tsx contient :
1. Une section "Ils etaient la ou tu es maintenant" avec 3 temoignages hardcodes (Estelle, Betty, Alex) en cartes -- lignes 265-301
2. Une section ScreenshotWall juste en dessous -- lignes 303-306

L'idee : supprimer la section hardcodee et remonter/agrandir le ScreenshotWall pour qu'il devienne LA section preuve sociale principale.

### Modifications

#### Home.tsx

1. **Supprimer** le tableau `homeTestimonials` (lignes 55-74) et l'import `Quote` devenu inutile
2. **Supprimer** toute la section temoignages hardcodes (lignes 265-301) : le `SectionHeader`, la grille de cartes, le bouton "Voir toutes les preuves"
3. **Fusionner** dans la section ScreenshotWall existante (lignes 303-306) :
   - Passer le titre "Ils etaient la ou tu es maintenant" et le sous-titre au ScreenshotWall
   - Ajouter le bouton "Voir toutes les preuves" sous le ScreenshotWall
   - Changer le variant de la section en "default" pour la differencier de "Comment choisir" qui est en cream

#### ScreenshotWall.tsx

4. **Agrandir l'affichage** : passer la grille de `columns-2 md:columns-3 lg:columns-4` a `columns-2 md:columns-3` avec `max-w-4xl` pour des images plus grandes et plus lisibles
5. Augmenter le shadow et le border-radius pour plus d'impact visuel

### Fichiers modifies

| Fichier | Action |
|---------|--------|
| `src/pages/Home.tsx` | Supprimer section temoignages hardcodes, integrer titre + CTA dans la section ScreenshotWall |
| `src/components/ScreenshotWall.tsx` | Agrandir la grille (moins de colonnes, images plus grandes) |

