# Mise en production de la refonte SEO (Lovable uniquement)

## Point de départ vérifié

- La PR #26 (`codex/refonte-seo-lovable`) est **déjà fusionnée** dans `main` et synchronisée dans le projet Lovable (commit de merge `852e7bc` présent). Aucune attente de fusion n'est nécessaire, et l'architecture livrée ne sera pas recréée.
- Le dépôt ne contient **aucun** `vercel.json` : rien de Vercel ne sera ajouté.
- Les 4 migrations `20260811*` sont présentes dans le dépôt mais **pas encore appliquées** : les tables `express_purchase_consents`, `withdrawal_requests` et `newsletter_opt_in_requests` sont absentes de la base.
- Le backend connecté est le projet Lovable Cloud du site (celui référencé par `VITE_SUPABASE_URL`) : je le confirmerai explicitement avant toute migration.

## Étape 1 - Validation du frontend (aucune modification de code prévue)

- `npm ci`, `npm run typecheck`, puis `npm run build` (client + SSR + prerender).
- Contrôle du contenu de `dist` : 16 pages marketing statiques, 17 coquilles `noindex`, 9 redirections HTML, plus `404.html`, `sitemap.xml`, `llms.txt`, `app.html`.
- Vérification dans le HTML brut (pas via le navigateur) : contenu visible, `title`, `description`, `canonical`, `H1` unique, header, footer, JSON-LD.
- Aucune canonique modifiée : elles restent sur `https://fredwav.com`.
- Si un compte attendu ne correspond pas, je le signale et je m'arrête au lieu de bricoler le manifeste.
- Correctif préalable identifié : `src/entry-server.tsx` importe `node:stream` alors que `"node"` n'est pas déclaré dans les `types` du tsconfig applicatif, ce qui fait échouer le typecheck. Seul ajustement de configuration prévu (déclaration des types Node), sans toucher à l'architecture de la refonte.

## Étape 2 - Backend

Migrations, dans cet ordre exact et une par une :

1. `20260811120000_create_express_consents.sql`
2. `20260811121000_create_withdrawal_requests.sql`
3. `20260811122000_harden_payment_fulfillment.sql`
4. `20260811123000_create_newsletter_opt_in_requests.sql`

Le SQL du dépôt est appliqué **tel quel**, sans réécriture. Après chaque migration, contrôle des tables, colonnes, RLS et GRANT.

Fonctions déployées ensuite : `create-express-checkout`, `record-wavacademy-consent`, `stripe-webhook`, `send-claim-email`, `mailerlite-subscribe`, `express-analysis`, `withdrawal-request`.

## Étape 3 - Audit des secrets (valeurs jamais affichées)

Je rends un tableau `présent / manquant / à confirmer` pour la liste du document. État déjà lisible côté projet :

- Présents : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_SECRET_KEY_TEST`, `STRIPE_WEBHOOK_SECRET`, `SMTP_PASSWORD`, `MAILERLITE_API_KEY`, `STRIPE_MODE`.
- Manquants à ce stade : `CONSENT_FINGERPRINT_KEY`, `MAILERLITE_GROUP_ID`, `MAILERLITE_EXPRESS_GROUP_ID`, `WITHDRAWAL_NOTIFICATION_EMAIL`, `STRIPE_EXPRESS_PAYMENT_LINK_LIVE`, `STRIPE_EXPRESS_PAYMENT_LINK_TEST`, les six liens `STRIPE_WAVACADEMY_*`.
- `ALLOW_TEST_FULFILLMENT` est absent en production : il restera absent.
- `CONSENT_FINGERPRINT_KEY` est bloquant pour les preuves de consentement : je le générerai côté serveur (valeur aléatoire jamais affichée) sauf refus de ta part. Les liens Stripe et identifiants MailerLite doivent venir de toi.

## Étape 4 - MailerLite

Je n'ai pas accès au tableau de bord MailerLite. Action manuelle de ton côté, sans contournement : **Account settings → Subscribe settings → activer "Double opt-in for API and integrations"**, puis me confirmer. Sans cette confirmation, `mailerlite-subscribe` est déployée mais je ne valide pas le parcours newsletter.

## Étape 5 - Recette avant publication

- Rendus 375, 390, 768 et 1280 px sur l'accueil, les trois offres, le hub Ressources et les trois guides TikTok.
- Parcours article → Analyse Express → résultat → Academy, avec contrôle des deux consentements non précochés et des lignes écrites en base.
- Accessibilité : navigation clavier du menu, focus visibles, cibles tactiles 44 px.
- Cookies refusés : aucune requête PostHog / Google Analytics. Cookies acceptés : mesure active.
- Formulaire de rétractation, statuts `failed` et `retry_delivery`, contrôlés côté serveur.

Limite assumée : **aucun test de paiement Stripe sandbox ne sera lancé sur la production**. Il n'existe pas d'environnement Lovable/Supabase preview isolé pour ce projet. Ce qu'il faudrait créer pour ces tests : un second projet Lovable relié à un backend distinct, avec `STRIPE_MODE=test`, `STRIPE_SECRET_KEY_TEST`, `STRIPE_WEBHOOK_SECRET_TEST`, les liens de paiement test Express et Academy, et `ALLOW_TEST_FULFILLMENT=true` uniquement là. Le paiement différé Academy et le rejeu de webhook resteront donc non validés, et je le noterai comme blocage plutôt que de les déclarer réussis.

## Étape 6 - Publication Lovable

Publication seulement si migrations, fonctions et secrets obligatoires sont au vert. Scan de sécurité, puis Publish/Update Lovable, `fredwav.com` conservé comme domaine principal, contrôle SSL et redirections de domaine, relance de l'audit SEO. L'URL `lovable.app` ne sera pas soumise à Search Console.

## Étape 7 - Contrôle du site publié

Mesures HTTP réelles (statut, canonical, directive robots, contenu attendu, redirection observée, verdict) sur : `/`, `/wavacademy`, `/analyse-express`, `/ressources/statistiques-tiktok`, `/start`, `/admin`, `/analyse-express/result`, `/offres`, `/one-shot/success`, et une URL inconnue.

Je ne prétendrai pas que Lovable garantit 307/308, `X-Robots-Tag` par route ou une vraie 404 serveur : je rapporterai ce que les réponses montrent. Si une URL privée ou inconnue est servie en 200 avec un contenu indexable, je documente le problème et je rédige un message précis pour le support Lovable.

## Compte rendu final

Exécuté, publié, migrations et fonctions déployées, secrets manquants (noms seulement), résultats de tests, blocages, actions manuelles restantes, et confirmation explicite qu'aucun composant Vercel n'a été ajouté.