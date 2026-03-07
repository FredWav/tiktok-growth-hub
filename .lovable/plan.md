

## Plan : Scroll horizontal infini pour les témoignages texte sur mobile

### Contexte
La section "Ce qu'ils en disent" (lignes 233-259) affiche les témoignages en grille `md:grid-cols-2 lg:grid-cols-3`. Sur petit écran, les 5 cards s'empilent verticalement — beaucoup de scroll.

### Changement

**Fichier** : `src/pages/Preuves.tsx`

- Sur mobile (`md` et en dessous), remplacer la grille par un conteneur de scroll horizontal avec défilement infini (marquee CSS).
- Sur desktop (`md+`), conserver la grille actuelle.

**Approche technique** : CSS animation `marquee` avec duplication des items pour créer l'illusion de boucle infinie.

- Ajouter un wrapper avec `overflow-hidden` visible uniquement sur mobile (`md:hidden`)
- À l'intérieur, un `flex gap-4 animate-marquee` contenant les cards dupliquées (×2) pour la continuité
- Chaque card en `min-w-[300px] shrink-0`
- Ajouter l'animation `@keyframes marquee` dans le className via Tailwind `animate-` ou inline style
- Ajouter `pause on hover` (`hover:pause` via animation-play-state)
- Garder la grille actuelle avec `hidden md:grid` pour desktop

**Keyframes** à ajouter dans `tailwind.config.ts` :
```
marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } }
```
Animation : `marquee 30s linear infinite`

### Fichiers impactés

| Fichier | Modification |
|---------|-------------|
| `src/pages/Preuves.tsx` | Wrapper mobile marquee + grille desktop |
| `tailwind.config.ts` | Ajouter keyframes `marquee` + animation |

