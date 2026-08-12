# Mise en production de la refonte SEO

Ce document liste les actions qui ne peuvent pas être exécutées par le build du site. Il complète le code livré et sert de checklist pour la prévisualisation, la publication via Lovable et le suivi Search Console.

## 1. Prévisualisation et publication Lovable

- Conserver le dépôt GitHub synchronisé avec le projet Lovable. Avant de publier, exécuter localement `npm ci`, `npm run typecheck` et `npm run build`. Le build doit produire les 16 pages statiques, les coquilles HTML `noindex` des routes fonctionnelles fixes, les pages de redirection des anciennes URL, `app.html`, `404.html`, `sitemap.xml` et `llms.txt` dans `dist`.
- Utiliser l'aperçu du projet ou le lien **Share preview** pour la recette visuelle. Ce lien est temporaire et ne doit pas être soumis à Search Console ni utilisé dans les URL canoniques.
- Vérifier dans le projet Lovable connecté que `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` correspondent bien au backend attendu avant chaque publication.
- Tester Stripe en environnement isolé avant la production. Définir `VITE_STRIPE_TEST_MODE=true`, `STRIPE_MODE=test` et `ALLOW_TEST_FULFILLMENT=true` uniquement dans cet environnement de test. Si le projet ne possède pas déjà la séparation Test/Live de Lovable, utiliser un projet Lovable/Supabase de test distinct : ne jamais activer `ALLOW_TEST_FULFILLMENT` sur le backend de production.
- Dans Lovable, ouvrir **Publish**, lancer le contrôle de sécurité, vérifier le titre, la description et l'image sociale, puis publier ou utiliser **Update** pour mettre à jour le site existant.
- Vérifier que `fredwav.com` est connecté et défini comme domaine principal. Les canoniques doivent continuer à pointer vers `https://fredwav.com`, y compris sur l'URL `lovable.app` secondaire.
- Après publication, relancer l'audit SEO Lovable. Pour ce projet React/Vite existant, Lovable pré-rend les URL publiques pour les moteurs, les robots de prévisualisation sociale et les moteurs IA ; contrôler malgré tout le HTML servi sur l'accueil, les offres et les trois guides.
- Le dépôt ne contient volontairement plus de `vercel.json`. Pour les anciennes URL permanentes, le build génère une redirection HTML immédiate, une canonique vers la destination, un lien visible et un repli JavaScript. Google traite normalement un `meta refresh` immédiat comme une redirection permanente. `/one-shot/success` reste temporaire et `noindex`. Les routes fonctionnelles fixes reçoivent directement une coquille HTML `noindex` ; les chemins dynamiques restent protégés au runtime.
- Lovable ne documente pas de configuration projet permettant d'imposer depuis le dépôt des redirections HTTP `307/308`, des en-têtes `X-Robots-Tag` par route ou une réponse 404 serveur. Après publication, relever les statuts réellement servis. Ne considérer ces garanties comme acquises que si les réponses HTTP les confirment ; sinon, vérifier l'absence d'indexation indésirable dans Search Console et solliciter le support Lovable si une vraie correction serveur est nécessaire.
- Les mentions légales et la politique de confidentialité indiquent désormais Lovable comme hébergeur. Vérifier l'entité figurant sur le contrat ou la facture du compte avant validation juridique finale.
- Demander au support Lovable son numéro de téléphone légal officiel destiné aux mentions d'hébergement, puis faire compléter et valider la page par un juriste. Aucun numéro actuel n'apparaît dans la documentation officielle consultée ; ne pas republier l'ancien numéro trouvé dans l'historique sans confirmation écrite de Lovable.

Documentation Lovable de référence :

- https://docs.lovable.dev/features/publish
- https://docs.lovable.dev/features/seo-aeo
- https://docs.lovable.dev/features/custom-domain

## 2. Backend Lovable / Supabase

Depuis l'intégration backend reliée au projet Lovable, appliquer les migrations avant de déployer les fonctions qui les utilisent :

1. `20260811120000_create_express_consents.sql`
2. `20260811121000_create_withdrawal_requests.sql`
3. `20260811122000_harden_payment_fulfillment.sql`
4. `20260811123000_create_newsletter_opt_in_requests.sql`

Déployer ensuite les fonctions modifiées ou ajoutées :

- `create-express-checkout`
- `record-wavacademy-consent`
- `stripe-webhook`
- `send-claim-email`
- `mailerlite-subscribe`
- `express-analysis`
- `withdrawal-request`

Secrets à contrôler dans **Lovable Cloud → Secrets** ou dans les secrets Edge Functions du projet Supabase connecté :

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_SECRET_KEY_TEST` et `STRIPE_MODE=test` dans l'environnement de test isolé
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_SECRET_TEST` si le même endpoint reçoit aussi les événements sandbox
- `STRIPE_EXPRESS_PAYMENT_LINK_LIVE`
- `STRIPE_EXPRESS_PAYMENT_LINK_TEST`
- `STRIPE_WAVACADEMY_LIVE_LINK_3M`, `STRIPE_WAVACADEMY_LIVE_LINK_6M`, `STRIPE_WAVACADEMY_LIVE_LINK_12M` (les valeurs de production actuelles restent utilisées en repli)
- `STRIPE_WAVACADEMY_TEST_LINK_3M`, `STRIPE_WAVACADEMY_TEST_LINK_6M`, `STRIPE_WAVACADEMY_TEST_LINK_12M` (obligatoires pour ouvrir un checkout sandbox Academy)
- `ALLOW_TEST_FULFILLMENT=true` uniquement dans l'environnement de test isolé
- `SMTP_PASSWORD`
- `WITHDRAWAL_NOTIFICATION_EMAIL` (par défaut : `contact@fredwav.com`)
- `CONSENT_FINGERPRINT_KEY` (clé longue et aléatoire dédiée aux empreintes HMAC)
- `MAILERLITE_API_KEY`
- `MAILERLITE_GROUP_ID`
- `MAILERLITE_EXPRESS_GROUP_ID` pour isoler les acheteurs Analyse Express volontaires

### Double opt-in MailerLite

Dans MailerLite, ouvrir **Account settings → Subscribe settings**, puis activer
**Double opt-in for API and integrations** avant de déployer `mailerlite-subscribe`.
La fonction envoie explicitement le statut `unconfirmed` documenté par MailerLite :
le formulaire affiche donc une demande de confirmation et ne promet plus que le
guide est déjà envoyé. Vérifier en mode test qu'un nouvel email reste
`unconfirmed` jusqu'au clic sur le lien reçu, puis devient `active`.

Documentation officielle consultée :

- https://www.mailerlite.com/help/how-to-use-double-opt-in-when-collecting-subscribers
- https://developers.mailerlite.com/api/subscribers

Conserver les preuves contractuelles pendant la durée validée avec le conseil juridique. Documenter cette durée dans la politique de confidentialité et prévoir la suppression ou l'anonymisation à échéance.

### Reprise des emails de rétractation

Chaque demande est enregistrée avant tout envoi. Les colonnes `acknowledgement_status` et `notification_status` valent `pending`, `sent` ou `failed`; `email_delivery_attempts`, `last_delivery_attempt_at` et `email_delivery_error` documentent les tentatives. Une panne SMTP ne remet donc pas en cause le dépôt et ne doit jamais être présentée au client comme un email envoyé.

Pour relancer uniquement les livraisons qui ne sont pas déjà marquées `sent`, appeler côté serveur — jamais depuis le navigateur — la fonction `withdrawal-request` avec l'en-tête `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` et le corps suivant :

```json
{
  "action": "retry_delivery",
  "request_reference": "RET-AAAAMMJJ-XXXXXXXX"
}
```

Cette action ne crée aucune nouvelle demande et ne modifie ni la déclaration ni son horodatage. Si les deux emails sont déjà confirmés, elle retourne leur état sans nouvel envoi.

## 3. Séquence Analyse Express vers Academy

Créer dans MailerLite une automatisation déclenchée par l'ajout au groupe `MAILERLITE_EXPRESS_GROUP_ID`. Elle ne doit viser que les personnes ayant volontairement demandé les emails.

Séquence recommandée :

1. Immédiatement : lien vers le rapport et rappel de ce qu'il mesure.
2. J+1 : comment lire une seule métrique sans conclure trop vite.
3. J+3 : un résultat documenté et contextualisé, sans promesse de résultat.
4. J+5 : présentation de la Wav Academy comme cadre de mise en pratique.
5. J+8 : rappel final, puis sortie de la séquence promotionnelle.

Chaque message doit contenir le lien de désinscription et ne doit pas réinscrire une personne désabonnée.

## 4. Validation avant publication

- Tester l'achat Analyse Express avec les deux cases contractuelles non précochées.
- Contrôler dans `express_purchase_consents` la version des CGV, le texte accepté, l'horodatage et la session Stripe.
- Contrôler dans `wavacademy_consents` les deux textes exacts, leurs versions, l'horodatage et l'empreinte HMAC ; les nouveaux achats ne doivent plus remplir les anciennes colonnes IP/navigateur en clair.
- Vérifier l'email durable de confirmation de commande et de consentement.
- Vérifier qu'un paiement différé Academy n'ouvre l'accès qu'après `checkout.session.async_payment_succeeded`, qu'un rejeu réutilise le même accès et le même claim, et qu'un échec SMTP passe l'email en `failed` puis le reprend au rejeu.
- Envoyer une demande de test depuis `/retractation`, puis contrôler l'identifiant, l'horodatage, le texte et la version de la déclaration, l'accusé client et la notification administrative.
- Tester une panne SMTP : la demande doit rester enregistrée, les statuts doivent passer à `failed`, le compteur doit augmenter et l'interface ne doit pas annoncer un envoi réussi. Restaurer ensuite SMTP et tester `retry_delivery` avec la clé service-role.
- Tester article → Analyse Express → paiement → résultat → Academy sur mobile et ordinateur.
- Refuser les cookies, puis vérifier qu'aucune requête PostHog ou Google Analytics n'est émise. Refaire le test après acceptation.
- Faire relire par un juriste les CGV, la renonciation à la rétractation, les remboursements et les frais forfaitaires avant publication.

L'événement client `academy_purchase` n'est volontairement pas émis sur le seul paramètre `?success=true`, qui peut être fabriqué. Le navigateur émet seulement `academy_checkout_return`. Un futur événement d'achat serveur ne devra être envoyé à PostHog qu'après vérification Stripe et uniquement si un consentement marketing exploitable peut être relié à la commande.

## 5. Search Console après mise en ligne

- Soumettre `/sitemap.xml`.
- Inspecter `/wavacademy`, `/hooks-tiktok` et les trois nouveaux guides TikTok.
- Identifier les deux URL « détectées, actuellement non indexées » de l'ancien export : corriger et demander l'indexation si elles sont publiques, sinon les retirer du sitemap et appliquer `noindex` ou une redirection.
- À 2, 4 et 8 semaines, relever : indexation, 404, Core Web Vitals, impressions non-marque, requêtes TikTok, CTR par page et conversion Analyse Express → Academy.
- À 8 semaines, exporter la dimension requête × page afin de contrôler la cannibalisation entre les trois guides et `/hooks-tiktok`.
