

## Corrections à apporter sur DiagnosticResult.tsx

Deux problèmes identifiés :

### 1. Durée de l'appel Calendly : "15 min" → "45 min"
Les boutons PREMIUM et ONE_SHOT_PLUS_PREMIUM affichent "Réserver une discussion stratégique (15 min)" alors que c'est **45 minutes**.

**Lignes concernées** : 185 et 206-207 (texte du bouton)

### 2. Le lien mail n'est pas optionnel
Le `MailFooter` ("Besoin d'en discuter par écrit ? Contacte-moi par mail.") est bien présent sur toutes les offres sauf EXPRESS — c'est correct et ça reste en place. Pas de changement ici.

### Fichier modifié
- `src/pages/DiagnosticResult.tsx` : remplacer "(15 min)" par "(45 min)" aux lignes 185 et dans le bloc ONE_SHOT_PLUS_PREMIUM.

