

## Plan : Page "Analyse Express" avec paiement et rapport PDF

### Vue d'ensemble

Nouvelle page `/analyse-express` permettant a un visiteur de :
1. Saisir son nom d'utilisateur TikTok
2. Payer 11,90 EUR via Stripe Checkout
3. Apres paiement, l'analyse est lancee via l'API WavSocialScan
4. Le resultat s'affiche et l'utilisateur peut telecharger le rapport PDF

### Secret requis

Une cle API WavSocialScan (`WAV_SOCIAL_SCAN_API_KEY`) est necessaire pour appeler l'API externe. Je te la demanderai avant d'implementer.

### Fichiers a creer

**1. Produit Stripe**
- Creer un produit "Analyse Express" a 11,90 EUR (1190 centimes) via les outils Stripe

**2. `supabase/functions/create-express-checkout/index.ts`**
- Recoit le `username` TikTok dans le body
- Cree une session Stripe Checkout en mode `payment` avec le price_id du produit a 11,90 EUR
- Passe le `username` dans `metadata` de la session pour le recuperer apres paiement
- `success_url` : `/analyse-express/result?session_id={CHECKOUT_SESSION_ID}`
- `cancel_url` : `/analyse-express`

**3. `supabase/functions/express-analysis/index.ts`**
- Recoit `session_id` dans le body
- Verifie le paiement via Stripe (`payment_status === "paid"`)
- Extrait le `username` depuis les metadata de la session
- Appelle `POST https://hesozoobtehszosdlnrn.supabase.co/functions/v1/api-gateway/accounts/{username}/analyze` avec la cle API WavSocialScan
- Attend quelques secondes puis appelle `GET /accounts/{username}` pour recuperer les donnees
- Retourne les donnees d'analyse au frontend

**4. `supabase/functions/express-pdf/index.ts`**
- Recoit `session_id` et `username` dans le body
- Verifie le paiement via Stripe
- Appelle `POST /accounts/{username}/pdf` de l'API WavSocialScan
- Retourne le contenu HTML/PDF au frontend pour telechargement

**5. `src/pages/AnalyseExpress.tsx`**
- Page de saisie : champ pour le nom d'utilisateur TikTok (avec validation `@username`)
- Bouton "Lancer l'analyse (11,90 EUR)" qui appelle `create-express-checkout`
- Redirige vers Stripe Checkout
- Mention Klarna/PayPal comme sur les autres pages

**6. `src/pages/AnalyseExpressResult.tsx`**
- Recupere `session_id` depuis l'URL
- Appelle `express-analysis` pour verifier le paiement et lancer/recuperer l'analyse
- Affiche un loader pendant l'analyse
- Affiche les resultats : health score, metriques, persona, recommandations
- Bouton "Telecharger le rapport PDF" qui appelle `express-pdf`

### Fichiers a modifier

**7. `src/App.tsx`**
- Ajouter les routes `/analyse-express` et `/analyse-express/result`

**8. `src/components/layout/Header.tsx`**
- Ajouter un lien "Analyse Express" dans la navigation

### Flow utilisateur

```text
[Page Analyse Express]
     |
     v
Saisie @username TikTok
     |
     v
Clic "Lancer l'analyse (11,90€)"
     |
     v
Stripe Checkout (paiement 11,90€)
     |
     v
Redirect → /analyse-express/result?session_id=xxx
     |
     v
Verification paiement + lancement analyse WavSocialScan
     |
     v
Affichage resultats (health score, metriques, recommandations)
     |
     v
Bouton "Telecharger le PDF"
```

### Details techniques

- L'API WavSocialScan est asynchrone (`POST /analyze` retourne un job_id). L'edge function `express-analysis` fera du polling sur `GET /accounts/{username}` toutes les 5 secondes (max 60s) jusqu'a obtenir les donnees
- Le `username` est stocke dans les `metadata` de la session Stripe pour eviter toute manipulation cote client
- Le `session_id` Stripe est persiste en `localStorage` comme pour le One Shot, permettant de revenir sur la page de resultats sans repayer
- Le PDF est genere via l'endpoint `POST /accounts/{username}/pdf` de WavSocialScan qui retourne du HTML, converti en telechargement cote client

