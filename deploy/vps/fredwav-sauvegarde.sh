#!/usr/bin/env bash
# Sauvegarde nocturne de la base fredwav (Supabase) sur le VPS.
#
# Lancé chaque nuit par fredwav-sauvegarde.timer, en root. pg_dump (image postgres:17, même
# version que Supabase) copie les schémas public, auth et storage avec le rôle en lecture
# seule « sauvegarde » (migration 20261021100000_role_sauvegarde.sql), dans
# /var/backups/fredwav (accès root seul). Les 14 dernières sauvegardes vérifiées sont gardées.
# Chaque réussite est signalée à Supabase, qui alerte par e-mail si le signal manque.
# Les fichiers stockés (photos, captures, packs) ne sont pas copiés : seulement leurs fiches.
#
#   fredwav-sauvegarde --empreinte
#     Crée le mot de passe du rôle s'il manque (il ne quitte jamais le VPS) et affiche son
#     empreinte SCRAM, à appliquer dans Supabase : ALTER ROLE sauvegarde PASSWORD '<empreinte>';
set -euo pipefail

PROJECT=ykcjzdqpvffdzlxxtjqc
HOST=db.$PROJECT.supabase.co
CONF=/etc/fredwav-sauvegarde
DEST=/var/backups/fredwav
KEEP=14
IMAGE=docker.io/library/postgres:17-alpine

umask 077
install -d -m 0700 "$CONF" "$DEST"
if [ ! -s "$CONF/motdepasse" ]; then
  python3 -c 'import secrets; print(secrets.token_urlsafe(32))' > "$CONF/motdepasse"
fi

if [ "${1:-}" = "--empreinte" ]; then
  python3 - "$CONF/motdepasse" <<'PY'
import base64, hashlib, hmac, os, sys
password = open(sys.argv[1]).read().strip().encode()
salt, iterations = os.urandom(16), 4096
salted = hashlib.pbkdf2_hmac("sha256", password, salt, iterations)
client_key = hmac.new(salted, b"Client Key", "sha256").digest()
server_key = hmac.new(salted, b"Server Key", "sha256").digest()
b64 = lambda raw: base64.b64encode(raw).decode()
print(f"SCRAM-SHA-256${iterations}:{b64(salt)}${b64(hashlib.sha256(client_key).digest())}:{b64(server_key)}")
PY
  exit 0
fi

exec 9>/run/fredwav-sauvegarde.lock
flock -n 9 || exit 0

printf '%s:5432:postgres:sauvegarde:%s\n' "$HOST" "$(cat "$CONF/motdepasse")" > "$CONF/pgpass"
name="fredwav-$(date +%Y%m%d-%H%M%S).dump"
partial=".$name.partiel"
trap 'rm -f "$DEST/$partial"' EXIT

# 1. Copie (format compressé de pg_dump, restaurable table par table avec pg_restore).
podman run --rm --network host -e PGPASSFILE=/pgpass \
  -v "$CONF/pgpass:/pgpass:ro" -v "$DEST:/out" --entrypoint pg_dump "$IMAGE" \
  "host=$HOST port=5432 dbname=postgres user=sauvegarde sslmode=require" \
  --format=custom --schema=public --schema=auth --schema=storage --file="/out/$partial"

# 2. Vérification : le fichier se relit et contient bien les données des tables du site.
tables=$(podman run --rm -v "$DEST:/out:ro" --entrypoint pg_restore "$IMAGE" --list "/out/$partial" \
  | grep -c ' TABLE DATA public ' || true)
if [ "$tables" -lt 20 ]; then
  echo "Sauvegarde refusée : $tables tables du site seulement dans $name" >&2
  exit 1
fi
chmod 600 "$DEST/$partial"
mv "$DEST/$partial" "$DEST/$name"
date -Iseconds > "$DEST/.derniere-reussie"

# 3. Seules les KEEP dernières sauvegardes vérifiées sont gardées.
ls -1t "$DEST"/fredwav-*.dump | tail -n +$((KEEP + 1)) | xargs -r rm -f --

detail="Sauvegarde $name : $(du -h "$DEST/$name" | cut -f1), $tables tables du site"
echo "$detail"

# 4. Signal à Supabase (migration 20261021110000_surveillance.sql) : sans signal depuis
#    26 heures, Supabase envoie une alerte à contact@fredwav.com.
podman run --rm --network host -e PGPASSFILE=/pgpass -v "$CONF/pgpass:/pgpass:ro" --entrypoint psql "$IMAGE"   "host=$HOST port=5432 dbname=postgres user=sauvegarde sslmode=require" -qAt -v ON_ERROR_STOP=1   -c "SET default_transaction_read_only = off" -c "SELECT public.sauvegarde_signal('$detail')" >/dev/null   || echo "Signal non transmis à Supabase : alerte e-mail sous 26 heures" >&2
