

## Correction de l'erreur 404 MailerLite

### Probleme
Le fetch POST vers `assets.mailerlite.com/jsonp/.../subscribe` retourne 404. Cet endpoint est concu pour les soumissions de formulaires HTML classiques, pas pour des requetes JSON fetch.

### Solution
Changer la methode d'envoi dans `src/pages/Mail.tsx` pour utiliser `FormData` et soumettre en `application/x-www-form-urlencoded` vers le bon endpoint MailerLite pour les formulaires embarques :

```
https://assets.mailerlite.com/jsonp/1305909/forms/148122258747498498/subscribe
```

Le format attendu est `application/x-www-form-urlencoded` avec les champs :
- `fields[name]` = prenom
- `fields[email]` = email  
- `ml-submit` = 1
- `anticsrf` = true

### Fichier modifie
**`src/pages/Mail.tsx`** : Remplacer le `fetch` JSON par une soumission `URLSearchParams` en mode `no-cors` (ou utiliser un formulaire HTML invisible qui soumet directement). Comme l'endpoint JSONP ne supporte pas CORS pour les reponses, la meilleure approche est de creer un `<form>` cache qui cible un `<iframe>` invisible, puis de detecter la soumission pour afficher le succes.

Alternative plus simple : passer par le mode `no-cors` avec fetch — on ne pourra pas lire la reponse mais la soumission passera, et on affiche le succes directement.

