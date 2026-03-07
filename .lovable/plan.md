

## Plan : Carousel mobile 1 card = 1 témoignage, pleine largeur, auto-scroll réversible

### Approche

Remplacer le marquee CSS actuel par un vrai carousel interactif utilisant Embla Carousel (déjà installé via `embla-carousel-react`). Embla supporte nativement le swipe, l'auto-play, et permet de détecter la direction du swipe.

### Fichier : `src/pages/Preuves.tsx`

**Mobile (`md:hidden`)** — Remplacer le div marquee (lignes 241-261) par :

- Un composant React avec `useEmblaCarousel` configuré en `loop: true`
- Chaque slide = 1 card occupant ~92% de la largeur écran (`basis-[92%]`) avec un petit padding pour laisser entrevoir la card suivante
- Auto-scroll toutes les 4 secondes via `setInterval` + `scrollNext()` ou `scrollPrev()` selon la direction courante
- Détection du swipe utilisateur via les events Embla (`pointerDown` / `select`) : si l'utilisateur swipe vers la gauche, l'auto-scroll continue vers la gauche ; s'il swipe vers la droite, l'auto-scroll change de sens
- Pause de l'auto-scroll pendant le toucher, reprise après relâchement

**Desktop** — Inchangé (grille classique).

### Détail technique

```text
State:
  direction: 'forward' | 'backward'  (default: 'forward')
  prevIndex: number

On embla 'select':
  newIndex = api.selectedScrollSnap()
  if user-initiated (not auto):
    if newIndex > prevIndex → direction = 'forward'
    if newIndex < prevIndex → direction = 'backward'
  prevIndex = newIndex

setInterval(4000):
  if direction === 'forward' → api.scrollNext()
  else → api.scrollPrev()

On pointerDown → clear interval
On pointerUp → restart interval
```

### Fichiers impactés

| Fichier | Modification |
|---------|-------------|
| `src/pages/Preuves.tsx` | Remplacer marquee mobile par carousel Embla avec auto-scroll directionnel |

Pas besoin de modifier `tailwind.config.ts` ni d'ajouter de dépendance (Embla déjà installé).

