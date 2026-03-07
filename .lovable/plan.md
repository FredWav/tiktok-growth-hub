

## Plan : 3 changements UX (Diagnostic TikTok handle, Blocage choix multiples, OneShot formulaire pré-paiement)

### Changement 1 — DiagnosticStart.tsx : Champ @handle TikTok (Step 1)

**Fichier** : `src/pages/DiagnosticStart.tsx`

- Remplacer `identitySchema.tiktokUrl` : validation `.url()` → `.regex(/^[a-zA-Z0-9_.]+$/, "Pseudo invalide")` avec `.min(2)`.max(50)
- Step 1 JSX : label "Ton pseudo TikTok", input avec `@` préfixé (span absolute + `pl-8`), placeholder "ton_username", texte d'aide sous le champ
- `handleIdentityNext` : valider avec `tiktokHandle` au lieu de `tiktokUrl` dans le schema, mais stocker dans `data.tiktokUrl` (pas de modif du context)
- `handleBlockerNext` : `notifyPayload.tiktok` utilise `data.tiktokUrl` (inchangé, c'est le handle maintenant)

Note : Le DiagnosticContext garde le champ `tiktokUrl` comme nom de clé — on y stocke simplement le handle au lieu de l'URL. Aucune modif du context.

### Changement 2 — DiagnosticStart.tsx : Blocage en choix multiples (Step 7)

**Fichier** : `src/pages/DiagnosticStart.tsx`

- Remplacer le contenu du Step 7 par 8 `OptionCard` + option "Autre" qui révèle un Textarea court
- Ajouter les icônes manquantes dans les imports lucide : `HelpCircle` est déjà importé via OneShot mais pas dans DiagnosticStart → à ajouter
- `handleBlockerNext` : supprimer la logique `minChars` / validation 150 caractères. Garder juste `if (!data.blocage.trim())` → erreur
- Icônes utilisées : `HelpCircle`, `Eye`, `Users`, `ShoppingBag`, `Clock`, `TrendingUp`, `DollarSign`, `Zap` (la plupart déjà importées)

### Changement 3 — OneShot : Formulaire avant paiement

**Fichiers** : `src/pages/OneShot.tsx` et `src/pages/OneShotSuccess.tsx`

**OneShot.tsx** :
- Ajouter imports : `useForm`, `zodResolver`, `z`, composants Form, Textarea, Label, Input
- Schema Zod `preCheckoutSchema` (name, whatsapp, tiktok, objectives)
- `useForm` avec le schema
- `handleCheckout` accepte `formData?` → sauvegarde en `sessionStorage("oneshot_pre_form")` avant redirect Stripe
- Hero : remplacer le bouton seul par le formulaire + bouton submit
- Footer CTA : scroll to top au lieu de `handleCheckout()`

**OneShotSuccess.tsx** :
- Dans `useEffect` après vérification : lire `sessionStorage("oneshot_pre_form")`, auto-submit via `send-oneshot-form`, marquer `oneshot_form_submitted`
- Supprimer tout le state `step`, `useForm`, le formulaire JSX
- Afficher directement : message de confirmation + bouton Calendly + fallback email
- Supprimer imports inutiles (useForm, zodResolver, z, Form components, Textarea)

### Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/pages/DiagnosticStart.tsx` | Modifié (step 1 + step 7 + handleBlockerNext + handleIdentityNext) |
| `src/pages/OneShot.tsx` | Modifié (ajout formulaire pré-checkout) |
| `src/pages/OneShotSuccess.tsx` | Modifié (suppression formulaire, auto-submit, affichage direct Calendly) |

Aucun autre fichier modifié. DiagnosticContext, edge functions, et composants UI restent intacts.

