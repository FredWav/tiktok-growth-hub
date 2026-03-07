

## Diagnostic

D'après la session replay, le dialog s'ouvre bien et tu peux cliquer dans les champs, mais **le texte saisi est invisible** car les inputs utilisent une couleur de texte sombre (`text-foreground`) sur le fond sombre du dialog (`bg-noir-light`). Le `text-cream` sur le DialogContent ne cascade pas dans les inputs qui ont leur propre style.

Il y a aussi un warning console "Missing Description" pour le DialogContent.

## Plan de correction

### 1. Corriger la visibilité des inputs dans le dialog

**Fichier : `src/pages/admin/Testimonials.tsx`**

- Ajouter des classes `text-cream bg-noir border-primary/20` sur chaque `<Input>` du formulaire pour que le texte soit visible sur fond sombre
- Ajouter les mêmes classes sur les `<Label>` si nécessaire
- Ajouter un `<DialogDescription>` pour corriger le warning d'accessibilité

### 2. Fichiers impactés

| Fichier | Modification |
|---------|-------------|
| `src/pages/admin/Testimonials.tsx` | Ajouter classes de style sur les inputs + DialogDescription |

Correction simple et ciblée, aucun changement de logique.

