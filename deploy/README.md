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

## Production

Au moment de la bascule seulement (docs/BASCULE.md) : même principe pour `main`, avec le
dossier `fredwav` et les réglages de production.
