# Bascule de fredwav.com vers la v2

Rien de ce document n'est exécuté sans le feu vert explicite de Fred. Le site actuel
(Lovable, `C:\Users\Fred\FWcom`, branche `main`) reste en ligne et intact jusqu'au jour J,
puis reste disponible pour un retour arrière pendant 2 à 4 semaines.

## Pourquoi les liens de paiement réels ne sont pas branchés avant le jour J

Les liens de paiement Stripe réels des analyses sont **partagés** avec le site actuel :
chaque paiement est confirmé par le webhook Stripe « live », qui pointe aujourd'hui vers
le backend Lovable. Tant que ce webhook n'est pas déplacé, un paiement lancé depuis la v2
serait encaissé sans que l'analyse ne parte. Le basculement des paiements se fait donc
**en une fois**, au jour J, en même temps que le DNS.

Le parcours reste celui de l'ancien site : même lien de paiement, même page de retour
(`/analyse-express/result?session_id=…`, `/analyse-video/merci`), même déclenchement de
l'analyse par le webhook, même e-mail de rapport.

## Valeurs de production relevées dans Stripe (18/10/2026)

Compte « Fred Wav Productions » (`acct_1QrtW3BfuzQl0PTi`), mode live.

| Secret du projet fredwav-prod | Valeur |
|---|---|
| `STRIPE_MODE` | `live` |
| `STRIPE_EXPRESS_PAYMENT_LINK_LIVE` | `https://buy.stripe.com/cNi5kCfBy7Hb3eO0z6cMM0J` |
| `STRIPE_EXPRESS_PRICE_ID_LIVE` | `price_1UI2AuBfuzQl0PTixTSsMijh` |
| `STRIPE_VIDEO_PAYMENT_LINK_LIVE` | `https://buy.stripe.com/8x2aEW2OM4uZ4iSepWcMM0O` |
| `STRIPE_VIDEO_PRODUCT_ID_LIVE` | `prod_VQXfFDOhT4rsnU` |
| `STRIPE_VIDEO_PRICE_ID_LIVE` | `price_1UPga0BfuzQl0PTipaAVi1cc` (2,90 €) |
| `SITE_URL` | `https://fredwav.com` |
| `COMMERCE_SALES_ENABLED` | `true` |
| `ALLOW_TEST_FULFILLMENT` | absent |
| `POSTHOG_SITE_HOST` | `fredwav.com` (statistiques : ignore les visites du site de test) |

Réglages des liens réels, inchangés : retour vers `https://fredwav.com/analyse-express/result?session_id={CHECKOUT_SESSION_ID}`
et `https://fredwav.com/analyse-video/merci`, facture automatique, adresse de facturation,
taxe automatique, codes promo autorisés. Les paiements One Shot / Academy / Premium
reprennent les mêmes réglages (facture, adresse, taxe automatique, prix TTC).

Le 1er janvier 2027, l'Analyse vidéo passe à 4,90 € : changer le prix du lien dans Stripe
(le webhook vérifie le produit, pas le prix) et `VIDEO_ANALYSIS_PRICE` dans `src/config/offers.ts`.
La Wav Academy passe à 990 € automatiquement (table `commerce_offers`).

## À préparer avant le jour J

| Qui | Quoi |
|---|---|
| Fred | Créer le projet Supabase gratuit **fredwav-prod** (région Frankfurt), puis me donner son identifiant |
| Claude | Appliquer les migrations et déployer les fonctions sur fredwav-prod, poser les réglages non secrets |
| Claude | Script de reprise des données Lovable → fredwav-prod, répété sur une copie jetable (comptages, commandes, accès Academy, rapports) |
| Fred | Stripe live : clé restreinte `rk_live_…` (Checkout Sessions : écriture, Payment Links : lecture), saisie dans fredwav-prod |
| Fred | Mot de passe SMTP de `noreply@fredwav.com` (voir ci-dessous) |
| Fred | Jeton du bot Discord et secret OAuth (régénérés le jour J) |
| Fred | PostHog : clé personnelle en lecture seule pour la page Statistiques (voir ci-dessous), saisie dans fredwav-staging puis fredwav-prod |
| Claude | Build de production (`.env.production` vers fredwav-prod) envoyé sur le VPS, testé sur une adresse privée avant le DNS |

**PostHog** (Europe, choix de Fred du 19/10/2026) : la v2 envoie ses statistiques au projet
« Default project » (312146) de PostHog **Europe** (eu.posthog.com, Francfort). L'historique de
l'ancien site reste dans le projet États-Unis (324948), consultable à part. Clé de lecture :
eu.posthog.com → menu du compte → Personal API keys, accès au projet 312146, portée **Query : Read**.
La saisir comme secret `POSTHOG_PERSONAL_API_KEY` du projet Supabase (Edge Functions → Secrets).
Sans elle, la page Statistiques affiche les ventes et marque l'audience « indisponible ».

**SMTP** (choix de Fred, 19/10/2026) : en production, on garde `noreply@fredwav.com`. Le site
actuel s'en sert : **son mot de passe ne change pas avant la bascule**. OVH ne permet pas de le
relire : il est changé pendant le gel des ventes de la bascule, saisi dans fredwav-prod (et dans
Lovable, pour un éventuel retour arrière). D'ici là, le site de test envoie depuis une adresse
dédiée (secret `SMTP_USER`), sans lien avec le site actuel.
Chaque e-mail client rappelle de ne pas répondre à cette adresse et d'écrire à
contact@fredwav.com (les réponses y sont de toute façon redirigées).

Secrets Supabase (Edge Functions → Secrets) : `SMTP_USER` (adresse d'envoi, `noreply@fredwav.com`
si absent) et `SMTP_PASSWORD`. Serveur OVH par défaut (`ssl0.ovh.net`, port 465). Ensuite :
admin → Paramètres → « Envoyer un e-mail de test » (envoi réel vers contact@fredwav.com).

Les e-mails de connexion (mot de passe oublié) passent par Supabase Auth, réglé à part :
Authentication → Emails → SMTP Settings, mêmes serveur, port, adresse et mot de passe,
expéditeur « Fred Wav ».

## Répétition de la reprise (18/10/2026, export du 17/10)

`node scripts/reprise-donnees.mjs ~/Downloads/fredwav_261017.backup` sur une copie jetable
(toutes les migrations v2) : 19 tables, 3 471 lignes, nombres et contenu ligne à ligne
identiques à l'export, 11 clés étrangères sans orpheline, adresses des 21 images réécrites
vers le nouveau projet. Résultat : « Reprise conforme ».

- Non repris : comptes admin (recréés), ancien système de réservation et de diagnostic
  (`availability_slots`, `bookings`, `diagnostic_leads`, `oneshot_submissions`), archivé
  dans `C:\Users\Fred\fredwav-archives` (hors dépôt : données personnelles).
- Academy : 2 accès historiques actifs, avec date de fin. L'admin permet de les passer
  à vie (« Ancien élève : Academy à vie »), si Fred le souhaite.
- Fichiers (`node scripts/reprise-fichiers.mjs`, vérification seule) : 27 sur 27 conformes
  (taille identique) : 11 photos de témoignages et 10 captures lues sur le site actuel,
  6 packs de hooks lus dans `E:/EMMA/outputs/bibliotheque-hooks/livraison` (`HOOKS_DIR`).

## Jour J (créneau calme, environ 1 h)

1. Baisser le TTL DNS de fredwav.com la veille (feu vert de Fred).
2. Mettre en pause les liens de paiement réels (Stripe) : plus aucun paiement pendant la bascule.
3. Exporter la base Lovable (même méthode que `fredwav_261017.backup`), puis :
   ```
   DATABASE_URL=<connexion fredwav-prod> NEW_SUPABASE_URL=https://<fredwav-prod>.supabase.co \
     node scripts/reprise-donnees.mjs <export.backup>
   NEW_SUPABASE_URL=… NEW_SERVICE_ROLE_KEY=… HOOKS_DIR=<dossier des packs> \
     node scripts/reprise-fichiers.mjs <export.backup>
   ```
   Les deux scripts doivent finir par « Reprise conforme » et « Fichiers conformes ».
   Puis reprendre les résultats et vidéos de témoignages dans les fiches de l'admin :
   `psql <connexion fredwav-prod> -f scripts/sql/temoignages-2026-10.sql` (rejouable).
   Recréer ensuite le compte admin (page /auth, code `ADMIN_SETUP_CODE`).
4. Stripe live : créer le webhook vers `https://<fredwav-prod>.supabase.co/functions/v1/stripe-webhook`
   (`checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `customer.subscription.deleted`), saisir son secret,
   puis **désactiver** l'ancien webhook Lovable `we_1T0ozpBfuzQl0PTiL9APvenY`
   (`https://rdpykyvqcckxpygwblxf.supabase.co/functions/v1/stripe-webhook`).
   Ne pas toucher au webhook `https://wavstats.com/api/webhooks/stripe` (WavStats).
5. Discord : adresse de retour OAuth vers fredwav-prod.
6. Ajouter `fredwav.com` et `www.fredwav.com` au Caddy du VPS (même méthode : sauvegarde,
   vérification, rechargement), avec le build de production.
7. DNS : faire pointer fredwav.com vers le VPS (feu vert de Fred).
8. Réactiver les liens de paiement ; achat réel d'une Analyse vidéo, puis remboursement.
9. Régénérer le secret `x-cron-secret` (l'ancien a été affiché une fois pendant la préparation).

## Retour arrière

Remettre l'ancien DNS, réactiver l'ancien webhook Lovable et désactiver le nouveau.
Le site Lovable n'est arrêté qu'après 2 à 4 semaines d'observation et un export final.
