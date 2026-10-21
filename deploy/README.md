# Mise en ligne

## Site de test (automatique)

1. Envoi sur la branche `v2` du dépôt GitHub.
2. GitHub (`.github/workflows/site-test.yml`) vérifie le typage, lance les tests, construit le
   site avec le projet Supabase de test et publie le paquet dans la version « site-test ».
3. Sur le VPS, `fredwav-site-test.timer` lance toutes les 2 minutes
   `/usr/local/bin/fredwav-site-test` (`deploy/vps/fredwav-site-test.sh`) : téléchargement,
   contrôle de l'empreinte, mise en ligne dans un nouveau dossier, bascule du lien `current`.
   Si les règles Caddy du site changent : vérification par Caddy, rechargement, contrôle
   d'andjoycook.com, retour à l'état précédent en cas de souci.

GitHub n'a aucun accès au VPS : c'est le VPS qui va chercher la version publiée (dépôt public).

- Installation sur le VPS : `SSH_CONFIG=… bash scripts/installer-deploiement-auto.sh`.
- Journal : `sudo journalctl -u fredwav-site-test -n 20`.
- Version en ligne : `/srv/andjoycook/data/caddy/sites/fredwav-staging/.version-en-ligne`.
- Une version refusée (règles Caddy invalides, paquet incomplet) n'est plus retentée :
  `.version-refusee` ; corriger puis renvoyer sur `v2`.

## Mise en ligne à la main, retour arrière

`SSH_CONFIG=… TARGET=fredwav-staging bash scripts/deploy-vps.sh` envoie le build local.
`ROLLBACK=<version> … bash scripts/deploy-vps.sh` remet une version précédente (5 conservées).
Pendant que la mise à jour automatique tourne, un retour arrière manuel est remplacé au
prochain envoi sur `v2`.

## Sauvegarde de la base (chaque nuit)

`fredwav-sauvegarde.timer` lance vers 3 h 15 `/usr/local/bin/fredwav-sauvegarde`
(`deploy/vps/fredwav-sauvegarde.sh`) : `pg_dump` (image `postgres:17-alpine`) des schémas
`public`, `auth` et `storage`, vérifié puis rangé dans `/var/backups/fredwav` (root seul,
14 dernières sauvegardes). Les fichiers stockés (photos, captures, packs) ne sont pas copiés.

- Rôle Supabase `sauvegarde` en lecture seule (migration `20261021100000_role_sauvegarde.sql`).
  Son mot de passe est créé sur le VPS (`/etc/fredwav-sauvegarde`) et n'en sort pas : seule son
  empreinte SCRAM est appliquée dans Supabase (`ALTER ROLE sauvegarde PASSWORD '<empreinte>'`).
- Installation : `SSH_CONFIG=… bash scripts/installer-sauvegarde.sh` (affiche l'empreinte).
- Journal : `sudo journalctl -u fredwav-sauvegarde -n 20` ; dernière réussite :
  `/var/backups/fredwav/.derniere-reussie`.
- Essai de restauration dans une base jetable : `sudo fredwav-restauration-essai`
  (21/10/2026 : lignes identiques à la base réelle).
- Chaque réussite est signalée à Supabase (`sauvegarde_signal`) : sans signal depuis 26 heures,
  e-mail d'alerte à contact@fredwav.com.
- Restaurer une table dans le projet : `pg_restore --data-only --table=<table> <fichier>` vers
  la connexion du projet, après accord de Fred.

## Alerte si le site tombe

Supabase (hébergé ailleurs que le VPS) vérifie le site toutes les 5 minutes (tâche `surveillance`,
migration `20261021110000_surveillance.sql`). Deux échecs de suite : e-mail d'alerte à
contact@fredwav.com, puis un e-mail quand il répond de nouveau. État : table `surveillance`.
Essai du 21/10/2026 (adresse volontairement fausse) : alerte et retour reçus en moins de 2 minutes.

## Production

Au moment de la bascule seulement (docs/BASCULE.md) : même principe pour `main`, avec le
dossier `fredwav` et les réglages de production.
