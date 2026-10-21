# Bascule de fredwav.com vers la v2

## Bascule faite le 21/10/2026 (feu vert de Fred)

Le projet Lovable était en pause faute de crédits : son serveur ne répondait plus (adresse
supprimée), l'export du jour était impossible. Reprise faite depuis l'export du 17/10
(`fredwav_261017.backup`) : 19 tables conformes ligne à ligne, puis vente réelle du 21/10 remise
et témoignages appliqués. Connexion à la base : rôle temporaire de la CLI
(`supabase db dump --linked --dry-run`, variables `PG*`) avec `PGOPTIONS="-c role=postgres"`.

- Données de test effacées (accord de Fred) ; catalogue, compte admin et surveillance gardés.
- Packs de hooks (6) envoyés depuis le disque E: avec `supabase storage cp` (chemins relatifs).
- **Perdus avec le stockage Lovable** : photos de témoignages, remplacées le 21/10 par la photo de
  profil TikTok actuelle de chaque client (10 sur 11 ; compte introuvable : initiales), et 10 captures
  (masquées : `is_active = false`), à renvoyer depuis l'admin avec les originaux.
- **Non repris** : 7 Analyses Express vendues sur l'ancien site du 17/10 (après l'export) au
  20/10, servies par Lovable avant sa panne ; visibles dans Stripe. Si Lovable est rechargé :
  nouvel export, puis reprise de ces lignes.
- DNS OVH : `fredwav.com` et `www.fredwav.com` en A vers `164.68.118.130` ; Caddy : blocs
  `fredwav.com` (mêmes fichiers que le site de test, mis à jour depuis `v2`) et `www` (redirection).
- `SITE_URL`, `POSTHOG_SITE_HOST`, Auth (Site URL et Redirect URLs) et surveillance sur
  `https://fredwav.com`.
- Reste : désactiver l'ancien webhook Lovable dans Stripe (Fred), passage des e-mails sur noreply@, nouveau secret cron.


Rien de ce document n'est exécuté sans le feu vert explicite de Fred. Le site actuel
(Lovable, `C:\Users\Fred\FWcom`, branche `main`) reste en ligne et intact jusqu'au jour J,
puis reste disponible pour un retour arrière pendant 2 à 4 semaines.

## Paiements réels (depuis le 21/10/2026, décision de Fred)

Le nouveau site encaisse en réel avant la bascule, avec les **mêmes** liens de paiement que le
site actuel. Stripe prévient deux serveurs : l'ancien webhook Lovable (`we_1T0ozpBfuzQl0PTiL9APvenY`,
inchangé) et un second webhook vers le nouveau projet (`we_1USzEoBfuzQl0PTiekQYmxei`, 4 événements
de paiement). Chaque serveur ne traite que ses propres commandes (`client_reference_id`) et range
celles de l'autre en « paiement à rapprocher » (alerte e-mail) : c'est attendu jusqu'à la bascule.
Clé restreinte `fredwav-v2` (Checkout Sessions : écriture, Payment Links : lecture) dans
`STRIPE_SECRET_KEY`, secret du nouveau webhook dans `STRIPE_WEBHOOK_SECRET` (saisis par Fred).

Limite connue : les liens renvoient après paiement vers `fredwav.com/analyse-express/result` et
`fredwav.com/analyse-video/merci`, donc l'ancien site jusqu'au DNS. L'analyse achetée sur le
nouveau site part quand même (webhook) et le client reçoit son rapport par e-mail.

## Projet Supabase de production

Décision de Fred (20/10/2026) : pas de second projet. Le projet de test **« fredwav.com v2 »**
(`ykcjzdqpvffdzlxxtjqc`, Francfort) devient la production : schéma, fonctions, tâches
planifiées, compte admin, clés PostHog et WavStats et réglage e-mail de connexion y sont déjà.
Le jour J, on y vide les données de recette, puis on remplace les réglages de test par ceux
de production (tableau ci-dessous). Après la mise en ligne, il n'y a plus de site de test : un
changement est vérifié en local puis mis en ligne ; un nouvel espace de test peut être recréé
(offre gratuite : 2 projets).

## Valeurs de production relevées dans Stripe (18/10/2026)

Compte « Fred Wav Productions » (`acct_1QrtW3BfuzQl0PTi`), mode live.

| Secret du projet (jour J) | Valeur |
|---|---|
| `STRIPE_MODE` | `live` (fait le 21/10) |
| `STRIPE_EXPRESS_PAYMENT_LINK_LIVE` | `https://buy.stripe.com/cNi5kCfBy7Hb3eO0z6cMM0J` |
| `STRIPE_EXPRESS_PRICE_ID_LIVE` | `price_1UI2AuBfuzQl0PTixTSsMijh` |
| `STRIPE_VIDEO_PAYMENT_LINK_LIVE` | `https://buy.stripe.com/8x2aEW2OM4uZ4iSepWcMM0O` |
| `STRIPE_VIDEO_PRODUCT_ID_LIVE` | `prod_VQXfFDOhT4rsnU` |
| `STRIPE_VIDEO_PRICE_ID_LIVE` | `price_1UPga0BfuzQl0PTipaAVi1cc` (2,90 €) |
| `SITE_URL` | `https://fredwav.com` |
| `COMMERCE_SALES_ENABLED` | `true` |
| `ALLOW_TEST_FULFILLMENT` | absent (fait le 21/10) |
| `POSTHOG_SITE_HOST` | `fredwav.com` (statistiques : ignore les visites de test) |
| `SMTP_USER` | supprimé (retour à `noreply@fredwav.com`) ; `SMTP_PASSWORD` = mot de passe de noreply@ |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | clé restreinte live et secret du nouveau webhook (saisis par Fred le 21/10) |
| `RECONCILE_CRON_SECRET` | régénéré (et mis à jour dans les tâches planifiées) |

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
| Claude | Script de reprise des données Lovable, répété sur une copie jetable (fait le 18/10) |
| Fred | Mot de passe SMTP de `noreply@fredwav.com`, changé le jour J seulement (voir ci-dessous) |
| Fred | Jeton du bot Discord et secret OAuth, saisis le jour J |
| Claude | Build de production envoyé sur le VPS, testé sur une adresse privée avant le DNS |

**PostHog** (Europe, choix de Fred du 19/10/2026) : la v2 envoie ses statistiques au projet
« Default project » (312146) de PostHog **Europe** (eu.posthog.com, Francfort). L'historique de
l'ancien site reste dans le projet États-Unis (324948), consultable à part. Clé de lecture :
eu.posthog.com → menu du compte → Personal API keys, accès au projet 312146, portée **Query : Read**.
La saisir comme secret `POSTHOG_PERSONAL_API_KEY` du projet Supabase (Edge Functions → Secrets).
Sans elle, la page Statistiques affiche les ventes et marque l'audience « indisponible ».

**SMTP** (choix de Fred, 19/10/2026) : en production, on garde `noreply@fredwav.com`. Le site
actuel s'en sert : **son mot de passe ne change pas avant la bascule**. OVH ne permet pas de le
relire : il est changé pendant le gel des ventes de la bascule, saisi dans le projet (et dans
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

**Adresses du site** (20/10/2026, site de test `https://fredwav.164-68-118-130.sslip.io`). Le jour J,
les trois passent à `https://fredwav.com` : le secret `SITE_URL` (liens des e-mails, retour
Discord), Authentication → URL Configuration → « Site URL », et la liste « Redirect URLs »
(`https://fredwav.com/**`, à la place de l'adresse de test ; `http://localhost:8080/**` peut rester).
Surveillance (alerte e-mail si le site tombe) : `UPDATE surveillance SET cible = 'https://fredwav.com' WHERE cle = 'site';`

**Discord** (20/10/2026) : nouvelle application **« Wav Academy »** (`1562098628158562325`), privée,
invitée sur le serveur Academy (`1409660758324805654`) avec « Créer une invitation » et « Gérer les
rôles ». C'est l'application définitive : le bot de l'ancien site n'est pas touché. Adresse de retour
OAuth : `https://ykcjzdqpvffdzlxxtjqc.supabase.co/functions/v1/wavacademy-claim-callback`.
Elle donne le vrai rôle des membres (`DISCORD_VIP2_ROLE_ID` = `1409885742598983863`, créé le
26/08/2025) ; le rôle du bot doit rester placé au-dessus.

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
3. Vider les données de recette du projet (garder le catalogue des offres, les places par mois,
   le compte admin **et les vraies ventes faites depuis le 21/10**), avec le feu vert de Fred. La reprise refuse une base non vide.
   Exporter la base Lovable (même méthode que `fredwav_261017.backup`), puis :
   ```
   DATABASE_URL=<connexion du projet> NEW_SUPABASE_URL=https://ykcjzdqpvffdzlxxtjqc.supabase.co \
     node scripts/reprise-donnees.mjs <export.backup>
   NEW_SUPABASE_URL=… NEW_SERVICE_ROLE_KEY=… HOOKS_DIR=<dossier des packs> \
     node scripts/reprise-fichiers.mjs <export.backup>
   ```
   Les deux scripts doivent finir par « Reprise conforme » et « Fichiers conformes ».
   Puis reprendre les résultats et vidéos de témoignages dans les fiches de l'admin :
   `psql <connexion du projet> -f scripts/sql/temoignages-2026-10.sql` (rejouable).
   Remplacer les réglages de test par ceux de production (tableau plus haut).
4. Stripe live : le webhook du nouveau site existe déjà (`we_1USzEoBfuzQl0PTiekQYmxei`). **Désactiver**
   l'ancien webhook Lovable `we_1T0ozpBfuzQl0PTiL9APvenY` (`https://rdpykyvqcckxpygwblxf.supabase.co/functions/v1/stripe-webhook`).
   Ne pas toucher au webhook `https://wavstats.com/api/webhooks/stripe` (WavStats).
5. Discord : bot et adresse de retour OAuth de production (voir « Discord » ci-dessous).
6. Ajouter `fredwav.com` et `www.fredwav.com` au Caddy du VPS (même méthode : sauvegarde,
   vérification, rechargement), avec le build de production.
7. DNS : faire pointer fredwav.com vers le VPS (feu vert de Fred).
8. Réactiver les liens de paiement ; achat réel d'une Analyse vidéo, puis remboursement.
9. Régénérer le secret `x-cron-secret` (l'ancien a été affiché une fois pendant la préparation).
10. Sauvegarde : `sudo systemctl start fredwav-sauvegarde` puis `sudo fredwav-restauration-essai`
    (vraies données dans la copie). Elle tourne ensuite seule chaque nuit (deploy/README.md).

## Retour arrière

Remettre l'ancien DNS, réactiver l'ancien webhook Lovable et désactiver le nouveau.
Le site Lovable n'est arrêté qu'après 2 à 4 semaines d'observation et un export final.
