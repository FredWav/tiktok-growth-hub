#!/usr/bin/env bash
# Essai de restauration de la dernière sauvegarde (fredwav-sauvegarde) dans une base jetable,
# sans réseau, supprimée à la fin. Affiche les erreurs et le nombre de lignes de tables clés.
#   sudo fredwav-restauration-essai
# Erreurs attendues, sans effet sur les données : rôles internes de Supabase (dashboard_user)
# et « schema "public" already exists ».
set -euo pipefail
IMAGE=docker.io/library/postgres:17-alpine
NAME=fredwav-restauration-essai
last=$(ls -1t /var/backups/fredwav/fredwav-*.dump | head -1)
podman rm -f "$NAME" >/dev/null 2>&1 || true
trap 'podman rm -f "$NAME" >/dev/null 2>&1 || true' EXIT
podman run -d --name "$NAME" --network none -e POSTGRES_HOST_AUTH_METHOD=trust -v /var/backups/fredwav:/in:ro "$IMAGE" >/dev/null
for i in $(seq 1 30); do podman exec "$NAME" pg_isready -U postgres -q && break; sleep 1; done
podman exec "$NAME" psql -U postgres -q -c "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE ROLE supabase_auth_admin; CREATE ROLE supabase_storage_admin; CREATE ROLE authenticator; CREATE ROLE supabase_admin; CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto SCHEMA extensions; CREATE EXTENSION \"uuid-ossp\" SCHEMA extensions;"
podman exec "$NAME" pg_restore -U postgres -d postgres --no-owner "/in/$(basename "$last")" 2> /tmp/restauration-erreurs.txt || true
echo "Fichier : $(basename "$last")"
echo "Erreurs de restauration : $(grep -c '^pg_restore: error' /tmp/restauration-erreurs.txt || true)"
grep '^pg_restore: error' /tmp/restauration-erreurs.txt | cut -c1-160 | sort | uniq -c | sort -rn | head -8
podman exec "$NAME" psql -U postgres -At -c "select 'auth.users='||count(*) from auth.users union all select 'commerce_orders='||count(*) from public.commerce_orders union all select 'express_analyses='||count(*) from public.express_analyses union all select 'video_analyses='||count(*) from public.video_analyses union all select 'commerce_offers='||count(*) from public.commerce_offers union all select 'trusted_clients='||count(*) from public.trusted_clients union all select 'user_roles='||count(*) from public.user_roles"
rm -f /tmp/restauration-erreurs.txt
