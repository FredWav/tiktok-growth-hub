# Mise en service des packs de hooks

Le changement s’applique aux nouvelles commandes. Les liens signés déjà envoyés restent valables selon leurs conditions d’origine. Pour ces anciennes commandes, la file d’envoi prouve l’envoi de l’email. Elle ne constitue pas une preuve du téléchargement.

## Préparer Stripe

Sur les quatre Payment Links (`hooks_100`, `hooks_250`, `hooks_500`, `hooks_850`), rendre la case d’acceptation obligatoire et renseigner le texte exact de la version courante dans `custom_text.terms_of_service_acceptance.message`. La commande suivante affiche ce texte avec le lien Markdown attendu par Stripe.

```powershell
node --input-type=module -e "import { HOOKS_CHECKOUT_CONSENT } from './supabase/functions/_shared/hooks-delivery.ts'; console.log(HOOKS_CHECKOUT_CONSENT)"
```

Vérifier le libellé affiché pour chaque lien. Confirmer que la case est décochée à l’ouverture et que le paiement est impossible tant qu’elle n’est pas cochée. Le message de confirmation du paiement annonce un email contenant un accès aux fichiers. Tester dans un sandbox Stripe et avec une boîte de recette.

## Vérifier avant mise en service

1. Sur le projet d’essai, appliquer la migration `20261110210000_hooks_download_evidence.sql` et déployer `hooks-download` puis `stripe-webhook` avec la version du site qui contient `/claim/hooks`. Vérifier que `SITE_URL` vise le site d’essai et que les événements de paiement asynchrone sont transmis au webhook.
2. Payer en sandbox sur chacun des quatre liens. Vérifier dans la session Stripe le texte accepté et, dans le journal `commerce_mail`, l’envoi de sa confirmation. Vérifier qu’un rejeu de l’événement produit une seule commande et un seul email.
3. Ouvrir la page sans cliquer sur un fichier. `first_download_at` doit être vide. Lancer le téléchargement, vérifier le fichier reçu et retrouver sa trace dans `hooks_orders`. Télécharger un autre fichier et vérifier que la première date reste identique. Vérifier aussi les cas sans consentement exact, lien expiré et rétractation reçue avant le premier téléchargement.
4. Coordonner la bascule des quatre liens avec la mise en service du site et des fonctions. Avant de rouvrir les liens, examiner les achats et emails de livraison encore en cours sous l’ancien texte. Un paiement dont le consentement est absent ou incompatible est conservé dans les paiements à rapprocher avec le motif `hooks_consent_review:<pack>`. Examiner la demande et contacter le client pour régulariser la livraison ou le remboursement applicable.

## Examiner une demande de rétractation

Rapprocher la référence Stripe de la commande, le texte accepté et sa version dans `hooks_orders`, la date d’envoi de la confirmation dans `commerce_mail` (clé `hooks:<référence Stripe>`) et l’heure de la demande. Une preuve de premier téléchargement indique le moment où le serveur a remis le premier fichier à la demande du navigateur. Elle ne prouve pas que le client a terminé le transfert ni ouvert le document. Vérifier séparément toute réclamation pour fichier manquant ou non conforme.
