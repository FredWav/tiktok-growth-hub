

## Intégration PostHog – Tracking stratégique sur tout le site

### 1. Installer posthog-js et initialiser

**Nouveau fichier `src/lib/posthog.ts`** :
- Initialiser PostHog avec la clé `phc_PtioXOoY4oT3GYJsV7xTpI3a2fscFeJfX6mzFGMWGDj` et host `https://us.i.posthog.com`
- Respecter le consentement GDPR : PostHog ne démarre le tracking qu'après acceptation des cookies (comme Google Analytics)
- Exporter des fonctions utilitaires : `initPostHog()`, `trackPostHogEvent(event, properties)`

### 2. Intégrer au consentement cookies

**Fichier `src/components/CookieConsent.tsx`** :
- Appeler `initPostHog()` quand l'utilisateur accepte les cookies
- Si déjà accepté au chargement, initialiser PostHog automatiquement

### 3. Enrichir `src/lib/tracking.ts`

- Ajouter PostHog en parallèle de Google Analytics dans `trackEvent()` → chaque appel existant envoie aussi à PostHog sans modifier les pages

### 4. Ajouter le tracking automatique de navigation

**Fichier `src/App.tsx`** :
- Ajouter un composant `PostHogPageTracker` qui capture un `$pageview` à chaque changement de route (via `useLocation`)

### 5. Événements stratégiques à tracker (en plus des existants)

Les `trackEvent()` existants couvrent déjà les clics CTA. On ajoute des événements de conversion critiques :

| Page | Événement | Déclencheur |
|------|-----------|-------------|
| `AnalyseExpress.tsx` | `express_checkout_start` | Clic "Lancer l'analyse" (validation username) |
| `AnalyseExpressResult.tsx` | `express_pdf_download` | Clic téléchargement PDF |
| `OneShot.tsx` | `oneshot_checkout_start` | Clic paiement |
| `OneShotSuccess.tsx` | `oneshot_form_submit` | Soumission du formulaire post-paiement |
| `VipCheckout.tsx` | `vip_plan_select` | Sélection d'un plan (3/6/12 mois) |
| `VipCheckout.tsx` | `vip_checkout_start` | Clic paiement |
| `WavPremiumApplication.tsx` | `wav_premium_apply` | Soumission candidature |
| `Contact.tsx` | `contact_social_click` | Clic sur un réseau social |
| `Home.tsx` | `faq_open` | Ouverture d'une question FAQ |

### 6. Identifier les utilisateurs

- Sur les pages de paiement (`VipCheckout`, `OneShot`), appeler `posthog.identify(email)` quand un email est saisi pour lier les événements à un utilisateur

### Fichiers modifiés

- **Nouveau** : `src/lib/posthog.ts`
- **Modifiés** : `src/lib/tracking.ts`, `src/components/CookieConsent.tsx`, `src/App.tsx`, `src/pages/AnalyseExpress.tsx`, `src/pages/AnalyseExpressResult.tsx`, `src/pages/OneShot.tsx`, `src/pages/OneShotSuccess.tsx`, `src/pages/VipCheckout.tsx`, `src/pages/WavPremiumApplication.tsx`, `src/pages/Contact.tsx`, `src/pages/Home.tsx`

