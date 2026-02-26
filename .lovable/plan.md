

## Mise a jour du prix Wav Premium : 800EUR -> 987EUR

Le prix du Wav Premium est actuellement affiche comme 800EUR a trois endroits dans le formulaire de candidature. Il faut le remplacer par 987EUR.

### Modifications

**Fichier : `src/pages/WavPremiumApplication.tsx`**

Trois occurrences de "800EUR" a remplacer par "987EUR" :

1. **Message de validation zod** (ligne 43) : "Tu dois confirmer que ton budget est d'au moins 987EUR"
2. **Texte informatif budget** (ligne 282) : "Le Wav Premium est un accompagnement intensif qui demande un investissement minimum de 987EUR."
3. **Label de la checkbox** (ligne 305) : "Je confirme que mon budget est d'au moins 987EUR pour cet accompagnement"

Aucune autre modification necessaire.

