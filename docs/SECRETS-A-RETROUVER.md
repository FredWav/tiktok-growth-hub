# Secrets : quoi retrouver, quoi recréer, quoi oublier

Règle d'or : **ne jamais régénérer ni supprimer une clé utilisée par le site actuel** avant la bascule. Quand le service le permet, on crée une **nouvelle** clé à côté de l'ancienne ; le site actuel continue de fonctionner avec la sienne.

Colonne « Test » : nécessaire pour le projet de test maintenant. Colonne « Bascule » : nécessaire seulement le jour de la mise en production.

## A. Rien à retrouver : visibles à tout moment dans tes tableaux de bord

Ce ne sont pas des secrets, juste des identifiants à recopier.

| Nom | Où le voir | Test | Bascule |
|---|---|---|---|
| `STRIPE_EXPRESS_PAYMENT_LINK_TEST` / `_LIVE` | Stripe → Liens de paiement | oui | oui |
| `STRIPE_EXPRESS_PRICE_ID_TEST` / `_LIVE` | Stripe → Catalogue → Analyse Express → prix | oui | oui |
| `STRIPE_VIDEO_PAYMENT_LINK_TEST` / `_LIVE` | Stripe → Liens de paiement | oui | oui |
| `STRIPE_VIDEO_PRODUCT_ID_TEST` / `_LIVE` | Stripe → Catalogue → Analyse vidéo | oui | oui |
| `STRIPE_WEBHOOK_SECRET_TEST` / `STRIPE_WEBHOOK_SECRET` | Créé avec le nouveau webhook (voir B) ; ensuite toujours visible via « Révéler » | oui | oui |
| `DISCORD_GUILD_ID` | Discord → clic droit sur le serveur → « Copier l'identifiant » (mode développeur activé) | non | oui |
| `DISCORD_VIP1_ROLE_ID`, `DISCORD_VIP2_ROLE_ID`, `DISCORD_VIP_ROLE_ID` | Discord → Paramètres du serveur → Rôles → clic droit → « Copier l'identifiant ». Les 5 abonnés Academy historiques utilisent VIP1 (3) et VIP2 (2) | non | oui |
| `DISCORD_CLIENT_ID` | Discord Developer Portal → ton application → OAuth2 | non | oui |
| `DISCORD_PING_USER_ID` | Ton identifiant Discord (clic droit sur ton nom) | non | optionnel |
| `ITPUSH_PROJECT_ID` | Tableau de bord itpush.dev | optionnel | optionnel |

## B. À recréer en parallèle (l'ancienne clé reste valable)

| Nom | Comment | Test | Bascule |
|---|---|---|---|
| `STRIPE_SECRET_KEY_TEST` | Stripe (mode test) → Développeurs → Clés API → « Créer une clé restreinte » avec **Checkout Sessions : lecture** et **Payment Links : lecture**. Le code ne fait que lire chez Stripe. | oui | — |
| `STRIPE_SECRET_KEY` (live) | Même chose en mode live : **clé restreinte** (`rk_live_…`). Ne pas « faire tourner » la clé secrète standard : ça couperait le site actuel. | — | oui |
| `STRIPE_WEBHOOK_SECRET_TEST` | Nouvelle destination webhook en mode test vers `https://ykcjzdqpvffdzlxxtjqc.supabase.co/functions/v1/stripe-webhook` (événements : `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.deleted`) | oui | — |
| `STRIPE_WEBHOOK_SECRET` (live) | Nouvelle destination webhook live vers le projet de production, créée le jour de la bascule | — | oui |
| `WAVSTATS_API_KEY` | Nouvelle clé API dans WavStats | oui | oui |
| `OPENAI_API_KEY` | platform.openai.com → API keys → « Create new secret key » (assistant de l'admin) | optionnel | optionnel |
| `ITPUSH_API_KEY` | itpush.dev → nouvelle clé (notifications push sur ton téléphone) | optionnel | optionnel |
| `DISCORD_WEBHOOK_URL` | Discord → salon → Intégrations → Webhooks → « Nouveau webhook » | optionnel | optionnel |

## C. Ne peuvent pas coexister : ne pas régénérer avant la bascule

Les régénérer maintenant couperait immédiatement le site actuel.

| Nom | Pour le test | Le jour de la bascule |
|---|---|---|
| `SMTP_PASSWORD` (boîte OVH `noreply@fredwav.com`) | Si tu connais le mot de passe, utilise-le. Sinon, pas d'e-mails sur le test pour l'instant (on pourra rendre la boîte d'envoi réglable). | Si inconnu : changer le mot de passe dans OVH, puis le saisir dans le nouveau projet au même moment |
| `DISCORD_BOT_TOKEN` | Créer une **application Discord de test** séparée (avec un petit serveur de test) | Régénérer le jeton du vrai bot et le saisir dans le nouveau projet |
| `DISCORD_CLIENT_SECRET` | Celui de l'application de test | Régénérer celui du vrai bot au même moment |
| `DISCORD_OAUTH_REDIRECT_URI` | Adresse calculée : `https://<projet>.supabase.co/functions/v1/wavacademy-claim-callback`, à déclarer aussi dans Discord → OAuth2 → Redirects | Idem avec le projet de production |

## D. Rien à retrouver : générés à neuf

| Nom | Qui s'en charge |
|---|---|
| `RECONCILE_CRON_SECRET`, `CONSENT_FINGERPRINT_KEY` | Claude, sans jamais les afficher (déjà fait pour le test) |
| `ADMIN_SETUP_CODE` | Toi : n'importe quel code, le temps de créer ton compte admin |
| `SITE_URL`, `STRIPE_MODE`, `ALLOW_TEST_FULFILLMENT`, `ITPUSH_ENABLED`, `WITHDRAWAL_NOTIFICATION_EMAIL` | Réglages simples, posés par Claude (la rétractation part par défaut vers contact@fredwav.com) |

## E. Plus nécessaires : ne pas chercher

| Nom | Pourquoi |
|---|---|
| `WAVSTATS_PARTNER_KEY`, `WAVSTATS_PARTNER_PLAN_ID`, `WAVSTATS_PROVISION_ENABLED` | La nouvelle Academy n'inclut plus de crédits WavStats |
| `MAILERLITE_API_KEY`, `MAILERLITE_*_GROUP_ID` | Newsletter et guide gratuit des hooks retirés du site (en suspens) |
| `WAV_SOCIAL_SCAN_API_KEY` | Ancien nom de `WAVSTATS_API_KEY` |
| `EXPRESS_SAMPLE_CONTRACT_VERIFIED` | Jamais activé en production (toutes les analyses depuis mars 2026 sont au format « legacy ») : on le laisse absent |
| `COMMERCE_ACADEMY_PAYMENT_URL`, `COMMERCE_PREMIUM_PAYMENT_URL`, `COMMERCE_*_PAYMENT_LINK_ID`, `COMMERCE_*_PRICE_ID`, `COMMERCE_SALES_ENABLED`, `COMMERCE_WAVSTATS_VERIFIED`, `COMMERCE_TRANSFER_INSTRUCTIONS` | Recréés au lot 1 avec la nouvelle gamme (One Shot, Academy à vie, Premium) |

## Valeurs relevées dans Stripe le 17/10/2026

Compte de production : « Fred Wav Productions » (`acct_1QrtW3BfuzQl0PTi`). L'ancien mode test ne contenait aucun lien de paiement et un catalogue de l'ancienne gamme (Express à 11,90 €) : les éléments de test ci-dessous ont été créés pour la v2.

| Élément | Test (créé, déjà enregistré dans fredwav-staging) | Production (relevé, pour la bascule) |
|---|---|---|
| Lien Analyse Express | `https://buy.stripe.com/test_7sYeVcexuaTng1Aa9GcMM00` | `https://buy.stripe.com/cNi5kCfBy7Hb3eO0z6cMM0J` (`plink_1UI2CYBfuzQl0PTiEVOvfZ2x`) |
| Prix Analyse Express | `price_1URc4xBfuzQl0PTi78MJlfLf` (produit `prod_VSX9iHJLjmOzNp`) | `price_1UI2AuBfuzQl0PTixTSsMijh` |
| Lien Analyse vidéo | `https://buy.stripe.com/test_28EbJ060Y8Lf6r00z6cMM01` | `https://buy.stripe.com/8x2aEW2OM4uZ4iSepWcMM0O` (`plink_1UPgbnBfuzQl0PTivbxuouPi`) |
| Produit Analyse vidéo | `prod_VSXBvEK9TCaSNM` | à relever sur la fiche produit le jour de la bascule |
| Webhook | destination `fredwav-v2-staging` (`we_1URcTJBfuzQl0PTiI0n1cmbH`) | à créer le jour de la bascule |

Retours après paiement des liens de test : `http://localhost:8080/analyse-express/result?session_id={CHECKOUT_SESSION_ID}` et `http://localhost:8080/analyse-video/merci` (à passer sur `https://staging.fredwav.com` au lot 1). Les liens de production demandent en plus nom, adresse de facturation, codes promo et (vidéo) téléphone et acceptation des CGU ; inutile pour les tests, le code ne s'en sert pas.

Les deux anciennes destinations webhook de test pointent vers un ancien projet Supabase (`hescz…`) : laissées telles quelles.

## En résumé, pour tester maintenant

1. Stripe en mode test : une clé restreinte, un webhook, puis recopier 4 identifiants (liens et prix Express et vidéo).
2. Une nouvelle clé API WavStats.
3. Le mot de passe SMTP, seulement si tu le connais.

Tout le reste attend la bascule ou peut être ignoré.
