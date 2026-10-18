#!/usr/bin/env bash
# Envoie le build (dist/ + dist-caddy/routes.caddy) sur le VPS, dans une nouvelle
# version, puis bascule le lien « current » d'un coup. Retour arrière : relancer
# avec ROLLBACK=<version> (voir deploy/README.md).
#
#   SSH_CONFIG=... SSH_HOST=emma-vps TARGET=fredwav-staging scripts/deploy-vps.sh
#
# Les fichiers sont lus par le Caddy d'andjoycook (dossier /data du conteneur).
set -euo pipefail

SSH_CONFIG="${SSH_CONFIG:?chemin du fichier ssh_config}"
SSH_HOST="${SSH_HOST:-emma-vps}"
TARGET="${TARGET:-fredwav-staging}"
BASE="/srv/andjoycook/data/caddy/sites/${TARGET}"
ssh_vps() { ssh -F "$SSH_CONFIG" "$SSH_HOST" "$@"; }

if [ -n "${ROLLBACK:-}" ]; then
  ssh_vps "sudo -n test -d '$BASE/releases/$ROLLBACK' && sudo -n ln -sfn 'releases/$ROLLBACK' '$BASE/current.next' && sudo -n mv -T '$BASE/current.next' '$BASE/current' && echo 'Version active : $ROLLBACK'"
  exit 0
fi

test -f dist/index.html -a -f dist/404.html -a -f dist-caddy/routes.caddy || {
  echo "Build incomplet : npm run build puis node scripts/caddy-routes.mjs" >&2
  exit 1
}
VERSION="$(date -u +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"
ARCHIVE="$(mktemp -t fredwav-XXXXXX.tgz)"
tar -C dist -czf "$ARCHIVE" .
scp -F "$SSH_CONFIG" -q "$ARCHIVE" "$SSH_HOST:/tmp/fredwav-$VERSION.tgz"
scp -F "$SSH_CONFIG" -q dist-caddy/routes.caddy "$SSH_HOST:/tmp/fredwav-$VERSION.caddy"
rm -f "$ARCHIVE"

ssh_vps bash -s -- "$BASE" "$VERSION" <<'REMOTE'
set -euo pipefail
BASE="$1"; VERSION="$2"
sudo -n mkdir -p "$BASE/releases/$VERSION"
sudo -n tar --no-same-owner -xzf "/tmp/fredwav-$VERSION.tgz" -C "$BASE/releases/$VERSION"
sudo -n install -m 0644 "/tmp/fredwav-$VERSION.caddy" "$BASE/releases/$VERSION.caddy"
rm -f "/tmp/fredwav-$VERSION.tgz" "/tmp/fredwav-$VERSION.caddy"
sudo -n ln -sfn "releases/$VERSION" "$BASE/current.next"
sudo -n mv -T "$BASE/current.next" "$BASE/current"
# Règles Caddy : copiées seulement si elles changent ; il faut alors recharger Caddy.
if ! sudo -n cmp -s "$BASE/releases/$VERSION.caddy" "$BASE/routes.caddy" 2>/dev/null; then
  sudo -n cp "$BASE/releases/$VERSION.caddy" "$BASE/routes.caddy"
  echo "Règles Caddy modifiées : rechargement nécessaire."
fi
# On garde les 5 dernières versions.
sudo -n find "$BASE/releases" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort | head -n -5 |
  while read -r old; do sudo -n rm -rf -- "$BASE/releases/$old" "$BASE/releases/$old.caddy"; done
echo "Version active : $VERSION"
REMOTE
