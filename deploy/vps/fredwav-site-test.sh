#!/usr/bin/env bash
# Mise à jour automatique du site de TEST (fredwav.164-68-118-130.sslip.io).
#
# Lancé toutes les 2 minutes par fredwav-site-test.timer, en root. Récupère la dernière
# version construite par GitHub (version « site-test » du dépôt public), vérifie son
# empreinte, la met en ligne dans un nouveau dossier puis bascule le lien « current ».
# Si les règles Caddy du site changent : vérification par Caddy, rechargement sans coupure,
# contrôle d'andjoycook.com, et retour à l'état précédent au moindre souci.
# Ne touche ni au Caddyfile principal ni à fredwav.com. GitHub n'a aucun accès au serveur.
set -euo pipefail

REPO=FredWav/tiktok-growth-hub
TAG=site-test
BASE=/srv/andjoycook/data/caddy/sites/fredwav-staging
DEPLOYED=$BASE/.version-en-ligne
REFUSED=$BASE/.version-refusee
CADDY=(podman exec andjoycook-proxy caddy)

exec 9>/run/fredwav-site-test.lock
flock -n 9 || exit 0

# 1. Dernière version annoncée par GitHub (dépôt public : aucune clé nécessaire).
release=$(curl -fsS --max-time 20 -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/releases/tags/$TAG") || exit 0
sha=$(printf '%s' "$release" | python3 -c 'import json, re, sys
m = re.search(r"sha=([0-9a-f]{40})", json.load(sys.stdin).get("body") or "")
print(m.group(1) if m else "")')
[ -n "$sha" ] || exit 0
[ "$(cat "$DEPLOYED" 2>/dev/null)" = "$sha" ] && exit 0
[ "$(cat "$REFUSED" 2>/dev/null)" = "$sha" ] && exit 0

# 2. Téléchargement et vérifications : empreinte, version annoncée, fichiers attendus.
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
url="https://github.com/$REPO/releases/download/$TAG"
curl -fsSL --max-time 180 -o "$work/site.tgz" "$url/site-test.tgz"
curl -fsSL --max-time 30 -o "$work/site.sha256" "$url/site-test.tgz.sha256"
if [ "$(sha256sum "$work/site.tgz" | cut -d' ' -f1)" != "$(tr -d '[:space:]' < "$work/site.sha256")" ]; then
  exit 0 # publication en cours côté GitHub : nouvel essai au prochain passage
fi
mkdir "$work/paquet"
tar --no-same-owner -xzf "$work/site.tgz" -C "$work/paquet"
[ "$(tr -d '[:space:]' < "$work/paquet/VERSION")" = "$sha" ] || exit 0
for f in dist/index.html dist/404.html routes.caddy; do
  [ -f "$work/paquet/$f" ] || { echo "paquet incomplet ($f) : version $sha refusée"; echo "$sha" > "$REFUSED"; exit 1; }
done

# 3. Mise en ligne dans un nouveau dossier, puis bascule d'un coup.
version="$(date -u +%Y%m%d-%H%M%S)-${sha:0:7}"
previous=$(readlink "$BASE/current" || true)
mkdir -p "$BASE/releases/$version"
cp -a "$work/paquet/dist/." "$BASE/releases/$version/"
install -m 0644 "$work/paquet/routes.caddy" "$BASE/releases/$version.caddy"
ln -sfn "releases/$version" "$BASE/current.next"
mv -T "$BASE/current.next" "$BASE/current"

# 4. Règles Caddy du site : seulement si elles changent.
if ! cmp -s "$BASE/releases/$version.caddy" "$BASE/routes.caddy"; then
  cp -p "$BASE/routes.caddy" "$BASE/routes.caddy.bak-$version"
  cp "$BASE/releases/$version.caddy" "$BASE/routes.caddy"
  restore() {
    cp -p "$BASE/routes.caddy.bak-$version" "$BASE/routes.caddy"
    if [ -n "$previous" ]; then
      ln -sfn "$previous" "$BASE/current.next"
      mv -T "$BASE/current.next" "$BASE/current"
    fi
    echo "$sha" > "$REFUSED"
  }
  if ! "${CADDY[@]}" validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
    restore
    echo "règles refusées par Caddy : version $sha annulée, rien n'a été rechargé"
    exit 1
  fi
  "${CADDY[@]}" reload --config /etc/caddy/Caddyfile --adapter caddyfile
  sleep 3
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 https://andjoycook.com/ || true)
  if [ "$code" != "200" ]; then
    restore
    "${CADDY[@]}" reload --config /etc/caddy/Caddyfile --adapter caddyfile
    echo "andjoycook.com a répondu $code après rechargement : retour à l'état précédent"
    exit 1
  fi
fi

echo "$sha" > "$DEPLOYED"
# On garde les 5 dernières versions.
find "$BASE/releases" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort | head -n -5 |
  while read -r old; do rm -rf -- "${BASE:?}/releases/$old" "${BASE:?}/releases/$old.caddy"; done
echo "Version en ligne : $version"
