

## Plan : Conformite cookies (bandeau RGPD) + mise a jour politique de confidentialite

### Ce qui sera fait

**1. Bandeau de consentement cookies (cookie banner)**

Creation d'un composant `CookieConsent` qui s'affiche en bas de page pour tous les visiteurs :
- Deux boutons : "Accepter" et "Refuser"
- Un lien vers la politique de confidentialite
- Le choix est sauvegarde dans `localStorage` pour ne plus reafficher le bandeau
- Si l'utilisateur refuse, Google Analytics (gtag) ne se charge pas / ne tracke pas
- Si l'utilisateur accepte, Google Analytics fonctionne normalement
- Design discret, fixe en bas de page

**2. Blocage conditionnel de Google Analytics**

Actuellement, le script Google Analytics (G-E361JPZX7D) se charge systematiquement dans `index.html`. Pour etre conforme :
- Le script dans `index.html` sera modifie pour ne pas envoyer de donnees par defaut (`window['ga-disable-G-E361JPZX7D'] = true`)
- Le composant `CookieConsent` activera Analytics uniquement si l'utilisateur accepte
- La fonction `trackEvent` dans `src/lib/tracking.ts` continuera de fonctionner normalement (elle ne fait rien si gtag n'est pas actif)

**3. Mise a jour de la page Politique de Confidentialite**

Le contenu de `src/pages/PolitiqueConfidentialite.tsx` sera remplace par le texte complet fourni, avec les 10 articles, et la mention de Google Analytics dans la section cookies. L'hebergeur sera indique comme "Lovable Labs Inc" (coherent avec les mentions legales existantes).

### Details techniques

**Fichiers modifies :**
- `index.html` : ajout de `window['ga-disable-G-E361JPZX7D'] = true` avant le chargement de gtag, pour bloquer Analytics par defaut
- `src/pages/PolitiqueConfidentialite.tsx` : remplacement complet du contenu avec le nouveau texte
- `src/App.tsx` : ajout du composant `CookieConsent` au niveau global (a cote des Toasters)

**Fichier cree :**
- `src/components/CookieConsent.tsx` : bandeau cookie avec logique d'acceptation/refus et activation/desactivation de Google Analytics

**Logique du bandeau :**
- Au chargement, verifie `localStorage.getItem("cookie_consent")`
- Si absent : affiche le bandeau
- Si "accepted" : active Google Analytics silencieusement
- Si "refused" : ne fait rien, pas de bandeau
- Le bandeau propose "Accepter" et "Refuser", avec un lien vers `/politique-de-confidentialite`

