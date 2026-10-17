# Secrets du projet de test (fredwav-staging)

Les secrets se collent dans le tableau de bord Supabase, jamais dans le code ni dans une conversation :
**https://supabase.com/dashboard/project/ykcjzdqpvffdzlxxtjqc/functions/secrets**
(bouton « Add new secret » : un nom, une valeur, « Save »).

Tout ce projet fonctionne en **mode test Stripe** : aucune vraie carte n'est débitée, et aucune clé « live » ne doit y être collée.

## Déjà réglés par Claude (rien à faire)

| Nom | Rôle |
|---|---|
| `STRIPE_MODE` = `test` | Force le mode test Stripe |
| `ALLOW_TEST_FULFILLMENT` = `true` | Les paiements test déclenchent réellement analyses et e-mails |
| `SITE_URL` | Adresse du site de test (à changer pour `https://staging.fredwav.com` au lot 1) |
| `RECONCILE_CRON_SECRET`, `CONSENT_FINGERPRINT_KEY` | Générés au hasard, jamais affichés |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | Fournis automatiquement par Supabase |

## 1. Paiements Stripe en mode test (prioritaire)

Dans Stripe, active le **mode test** (interrupteur « Test mode » en haut à droite).

| Nom | Où le trouver |
|---|---|
| `STRIPE_SECRET_KEY_TEST` | Développeurs → Clés API → « Clé secrète » (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET_TEST` | Développeurs → Webhooks → « Ajouter une destination » : URL `https://ykcjzdqpvffdzlxxtjqc.supabase.co/functions/v1/stripe-webhook`, événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.deleted`. Puis « Secret de signature » (`whsec_…`) |
| `STRIPE_EXPRESS_PAYMENT_LINK_TEST` | Liens de paiement → lien test de l'Analyse Express (`https://buy.stripe.com/test_…`) |
| `STRIPE_EXPRESS_PRICE_ID_TEST` | Catalogue → Analyse Express → prix (`price_…`) |
| `STRIPE_VIDEO_PAYMENT_LINK_TEST` | Lien test de l'Analyse vidéo |
| `STRIPE_VIDEO_PRODUCT_ID_TEST` | Catalogue → Analyse vidéo → identifiant produit (`prod_…`) |

Dans chaque lien de paiement test, l'URL de redirection après paiement doit pointer vers le site de test (on la réglera ensemble au lot 1).

## 2. Analyses et e-mails

| Nom | Où le trouver | Remarque |
|---|---|---|
| `WAVSTATS_API_KEY` | Ton espace WavStats (clé API rapports) | Chaque analyse test consomme des crédits réels |
| `SMTP_PASSWORD` | Mot de passe OVH de `noreply@fredwav.com` | Les e-mails de test partent vraiment : utilise tes propres adresses |
| `EXPRESS_SAMPLE_CONTRACT_VERIFIED` = `true` | — | Même valeur qu'en production si le rapport « sample-v3 » est validé |

## 3. Plus tard (pas nécessaire pour les premiers tests)

| Nom | Usage | Quand |
|---|---|---|
| `ADMIN_SETUP_CODE` | Code pour créer ton compte admin sur le site de test | Au premier test de l'admin |
| `DISCORD_*` (bot, serveur, OAuth, rôle) | Accès Academy | Avec un serveur Discord de test, au lot 1 |
| `MAILERLITE_*` | Newsletter | À éviter sur le test (polluerait tes listes) |
| `ITPUSH_*`, `DISCORD_WEBHOOK_URL`, `DISCORD_PING_USER_ID` | Notifications push | Optionnel |
| `OPENAI_API_KEY` | Assistant de l'admin | Optionnel |
| `COMMERCE_*` | Ventes d'accompagnements | Réécrits au lot 1 (nouvelle gamme) |
| `WAVSTATS_PARTNER_*`, `WAVSTATS_PROVISION_ENABLED` | Crédits WavStats de l'ancienne Academy | Inutiles : la nouvelle Academy n'en inclut plus |

## Ne jamais coller ici

`STRIPE_SECRET_KEY` (clé live), `STRIPE_WEBHOOK_SECRET` (webhook live) ou tout lien `buy.stripe.com` sans `test_` : le projet de test ne doit jamais toucher l'argent réel.
