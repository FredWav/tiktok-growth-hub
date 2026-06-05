## Problème

Sur mobile, la popup "Obtiens un diagnostic complet de ton compte TikTok" (`ExitIntentPopup`) dépasse la hauteur du viewport. Le contenu du `Dialog` est centré verticalement avec `translate-y-[-50%]`, donc le haut de la popup (où se trouve la croix de fermeture en `top-4 right-4`) est rendu **au-dessus de la zone visible** de l'écran. Résultat : impossible de fermer la popup sur petit écran.

## Correctif

Modifier uniquement `src/components/ExitIntentPopup.tsx` :

1. Ajouter sur `<DialogContent>` les classes `max-h-[90vh] overflow-y-auto` pour borner la hauteur et rendre le contenu scrollable si besoin.
2. Ajouter un bouton de fermeture visible et accessible **dans le flux** du contenu (en haut à droite, via `DialogClose` de Radix) avec un fond opaque et un padding suffisant pour le tap mobile. Ça garantit qu'il reste atteignable même si la croix native du `DialogContent` est masquée par le scroll ou clippée.
3. Garder le comportement existant (déclencheurs, tracking, navigation).

Aucune autre page ni composant n'est touché. Pas de migration ni d'edge function.
