

## Deux modifications demandées

### 1. Détection du navigateur TikTok — banner "Ouvrir dans le navigateur"

TikTok ouvre les liens dans son navigateur intégré (in-app browser), qui est limité (pas de paiement Stripe, pas de redirection propre). On détecte le user-agent TikTok et on affiche un bandeau fixe en haut de page avec un lien pour ouvrir dans le navigateur natif.

**Fichier : `src/components/TikTokBrowserBanner.tsx`** (nouveau)
- Détecte `navigator.userAgent` contenant `TikTok` ou `BytedanceWebview`
- Si détecté, affiche un bandeau sticky en haut : "Tu es sur le navigateur TikTok. Pour une meilleure expérience, ouvre cette page dans ton navigateur."
- Bouton "Ouvrir dans mon navigateur" qui utilise l'astuce `intent://` sur Android ou copie l'URL dans le clipboard avec un message d'instruction sur iOS
- Le bandeau peut être fermé

**Fichier : `src/components/layout/Layout.tsx`** — importer et afficher le `TikTokBrowserBanner` en haut du layout global pour que ça fonctionne sur toutes les pages.

### 2. Supprimer le popup Analyse Express pour les visiteurs venant de `/start`

Les utilisateurs qui arrivent de `/start` ont déjà été qualifiés par le tunnel. Le popup Analyse Express est redondant pour eux.

**Fichier : `src/pages/DiagnosticStart.tsx`** — à la complétion du diagnostic (dans `handleBudgetSelect`), écrire un flag en sessionStorage : `sessionStorage.setItem("from_diagnostic", "true")`.

**Fichier : `src/components/WavSocialScanPopup.tsx`** — au début du `useEffect`, vérifier `sessionStorage.getItem("from_diagnostic")`. Si présent, ne pas afficher le popup (return early).

### Résumé des fichiers

| Fichier | Action |
|---------|--------|
| `src/components/TikTokBrowserBanner.tsx` | Créer |
| `src/components/layout/Layout.tsx` | Ajouter le banner |
| `src/pages/DiagnosticStart.tsx` | Ajouter `sessionStorage.setItem("from_diagnostic", "true")` |
| `src/components/WavSocialScanPopup.tsx` | Vérifier le flag et skip si présent |

