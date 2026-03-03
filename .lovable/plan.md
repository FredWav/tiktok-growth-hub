

## Plan : Ajouter un bouton retour sur la page Diagnostic

### Fichier modifie : `src/pages/DiagnosticStart.tsx`

Ajouter un bouton "Retour" en haut a gauche de chaque etape (steps 1 a 5) qui revient a l'etape precedente. Sur l'etape 0 (welcome), pas de bouton retour. Sur l'ecran de resultat (step 6), pas de bouton retour non plus.

- Icone `ArrowLeft` de Lucide (deja importe ou a ajouter)
- Bouton style `ghost` positionne en haut a gauche du conteneur, au-dessus du contenu de l'etape
- `onClick` : `setStep(step - 1)` pour revenir a l'etape precedente
- Visible uniquement quand `step >= 1 && step <= 5`

