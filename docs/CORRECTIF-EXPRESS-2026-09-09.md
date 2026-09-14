# Correctif Analyse Express — 9 septembre 2026

Correctif local uniquement : aucune donnée de production modifiée, aucune fonction déployée.

## Comportement

- Client, administration et rattrapage utilisent la même finalisation, à partir du job et de la version de rapport enregistrés en base.
- Les écritures vérifient le statut, le job et la date de démarrage : une ancienne réponse ne peut remplacer une relance, un remboursement ou une finalisation concurrente.
- Un démarrage sans job pendant plus de cinq minutes passe en échec avec demande d’intervention. Aucun second appel de lancement n’est envoyé automatiquement.
- Les appels WavStats de lancement sont limités à trente secondes. La ligne existe avant l’appel, y compris en lancement manuel. Si l’enregistrement échoue après acceptation, l’identifiant distant figure dans l’erreur de récupération.
- Les relances administrateur sont verrouillées avant l’appel distant et remettent le compteur de durée à zéro. Les dossiers remboursés, les traitements actifs et les intentions non payées ne sont pas relançables.
- Une réponse HTTP 404/410 termine le suivi avec une erreur explicite. Les erreurs réseau, 429 et erreurs serveur restent récupérables sur le même job et sont visibles.
- La newsletter est appelée après enregistrement du job, avec une limite de dix secondes. Une notification ne peut plus attendre indéfiniment.
- Le tableau distingue paiement attendu, démarrage, traitement, réussite, échec et remboursement. Il actualise sa liste et reprend le suivi des traitements existants. Le bouton « Vérifier » consulte le traitement sans en créer un autre.
- Les vérifications administrateur ne se chevauchent pas entre tours et s’arrêtent après dix minutes par traitement dans la page. Les requêtes sont annulées à la fermeture. Le rattrapage serveur continue indépendamment.

## Contrat de rapport

Le contrat payé `sample-v3` reste strict : aucun résultat historique n’est présenté comme un échantillon attesté. Les anciens rapports `legacy` restent compatibles. Une réponse sans rapport ou sans interprétations ne peut plus être déclarée terminée par l’administration.

Les nouvelles intentions payantes utilisent `sample-v3` lorsque `EXPRESS_SAMPLE_CONTRACT_VERIFIED=true`. Tant que cette intégration n’est pas validée, elles restent vendables avec le contrat `legacy` réellement pris en charge par WavStats, sans coupure globale en 503. Un nouveau diagnostic manuel suit la même règle. Une relance conserve la version du dossier.

Ce correctif ne démontre pas que WavStats fournit `analysisScope`. Les dossiers existants incompatibles sont signalés ; leur version n’est pas modifiée automatiquement et ils ne sont pas relancés en production.

## Bascule

Déployer ensemble les fonctions suivantes, qui embarquent les modules partagés modifiés :

- `express-analysis`
- `express-analysis-status`
- `check-express-job`
- `retry-express-analysis`
- `manual-express-analysis`
- `reconcile-express-analyses`
- `create-express-checkout`

Puis publier le client. Aucune nouvelle migration n’est requise ; les migrations commerce du 8 septembre restent un prérequis.

Vérifier la tâche `express-v3-minute` et sa configuration Vault sur le projet cible. Pour un lancement interrompu ou un identifiant distant à récupérer, vérifier le traitement dans WavStats avant toute nouvelle relance manuelle. Ne pas rejouer automatiquement les analyses de la capture.

## Vérifications locales

- `npm run test:commerce` : calculs, contrats de rapport, erreurs prestataire, concurrence de finalisation et relance, récupération de lancement.
- `deno test --no-config --no-lock --cached-only --allow-env --node-modules-dir=none tests/express-status.test.ts` : vérification du paiement et isolation des résultats, sans permission réseau.
- `npm run typecheck` et `deno check --no-config --no-lock --node-modules-dir=none` sur les sept fonctions ci-dessus.
- ESLint ciblé sur les fichiers modifiés et `git diff --check`.

Les tests simulent les prestataires et la base. Ils ne remplacent pas une recette avec WavStats dans un environnement de test. Le lint global contient des erreurs préexistantes hors de ce correctif.
