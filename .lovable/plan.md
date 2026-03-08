

## Plan : Remplacer les témoignages texte hardcodés par le ScreenshotWall sur /preuves

### Constat

La seule page avec des commentaires texte hardcodés est **Preuves.tsx** (lignes 61-152) : 5 témoignages (Estelle, Delphine, Alex, Betty, Reva) affichés en cartes avec carousel mobile.

Un `ScreenshotWall` existe déjà sur cette page (ligne 280) avec le titre "Leurs messages". Les vrais messages sont déjà là, les cartes hardcodées font doublon.

### Modifications dans `src/pages/Preuves.tsx`

1. **Supprimer** le tableau `testimonials` (lignes 61-92)
2. **Supprimer** le type `Testimonial` et le composant `MobileTestimonialCarousel` (lignes 154-241)
3. **Supprimer** toute la section "Ce qu'ils en disent" (lignes 331-360) : le SectionHeader, le carousel mobile, et la grille desktop
4. **Agrandir le ScreenshotWall existant** : changer le titre en "Ce qu'ils en disent" et le sous-titre en "Retours directs de clients après leur accompagnement." pour reprendre le wording de la section supprimée
5. **Nettoyer les imports** : retirer `Quote`, `useEmblaCarousel`, `useCallback`, `useRef`, `useEffect` s'ils ne sont plus utilisés, ainsi que `Card`/`CardContent`

### Résultat

La page /preuves affichera : Hero → Vidéos YouTube → ScreenshotWall (vrais messages, plus gros) → CTA → Stats → Études de cas → Offres. Plus aucun commentaire hardcodé.

