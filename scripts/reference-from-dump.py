"""Régénère la migration de référence depuis un export pg_dump (format custom) de la prod.

Usage : python scripts/reference-from-dump.py <export.backup> [pg_restore]

Garde le schéma public complet (tables, RLS, clés étrangères, fonctions, droits),
les règles d'accès du stockage, le déclencheur auth.users et les définitions de
buckets. N'extrait jamais de données. Retire ce qui est propre à Lovable Cloud
(rôles sandbox_exec*, méta-commandes psql \\restrict).
"""
import re
import subprocess
import sys
from pathlib import Path

DUMP = sys.argv[1]
PG_RESTORE = sys.argv[2] if len(sys.argv) > 2 else r"C:\Program Files\PostgreSQL\17\bin\pg_restore.exe"
OUT = Path(__file__).resolve().parent.parent / "supabase/migrations/20261017120000_reference_prod.sql"

HEADER = """-- Migration de référence : schéma réel de la production au 17/10/2026.
--
-- Générée par scripts/reference-from-dump.py depuis l'export Lovable Cloud
-- (pg_dump 18.6, base 17.6) : schéma public complet + règles d'accès du stockage,
-- sans aucune donnée. Elle remplace les 73 migrations Lovable/manuelles et le canal
-- Drizzle, qui ne décrivaient plus la production ; ils restent dans l'historique git.
-- Les évolutions v2 (catalogue, droits, nettoyage) viennent dans des migrations suivantes.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

"""

FOOTER = """
--
-- Déclencheur sur auth.users (profil créé à l'inscription d'un compte admin)
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--
-- Buckets de stockage (définitions seulement ; les fichiers sont copiés à la bascule)
--

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('client-images', 'client-images', false, NULL, NULL),
  ('observations', 'observations', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('trusted-avatars', 'trusted-avatars', true, NULL, NULL),
  ('client-screenshots', 'client-screenshots', true, NULL, NULL),
  ('hooks-packs', 'hooks-packs', false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;


-- pg_dump vide search_path : on le rétablit pour les migrations suivantes.
SELECT pg_catalog.set_config('search_path', '"$user", public, extensions', false);
"""

# Types d'entrée TOC en un ou deux mots, suivis du schéma.
TWO_WORD = ("FK CONSTRAINT", "ROW SECURITY", "DEFAULT ACL", "TABLE DATA", "SEQUENCE SET", "SEQUENCE OWNED")
LINE = re.compile(r"^\d+; \d+ \d+ (.+)$")


def keep(entry: str) -> bool:
    for kind in TWO_WORD:
        if entry.startswith(kind + " "):
            if kind in ("TABLE DATA", "SEQUENCE SET", "DEFAULT ACL"):
                return False  # données, ou droits par défaut déjà fixés par Supabase
            return entry[len(kind) + 1:].startswith("public ")
    kind, _, rest = entry.partition(" ")
    if kind == "ACL" and rest.startswith("- SCHEMA public "):
        return False  # droits du schéma public : gérés par Supabase
    if kind == "POLICY" and rest.startswith("storage objects "):
        return True
    return rest.startswith("public ")


toc = subprocess.run([PG_RESTORE, "-l", DUMP], capture_output=True, text=True, check=True, encoding="utf-8").stdout
selected = [l for l in toc.splitlines() if not l.startswith(";") and (m := LINE.match(l)) and keep(m.group(1))]
listing = Path(OUT.parent.parent / ".temp" / "reference.list")
listing.parent.mkdir(exist_ok=True)
listing.write_text("\n".join(selected) + "\n", encoding="utf-8")

sql = subprocess.run([PG_RESTORE, "-L", str(listing), "--no-owner", "-f", "-", DUMP],
                     capture_output=True, text=True, check=True, encoding="utf-8").stdout
body = [l for l in sql.splitlines()
        if not l.startswith("\\restrict ") and not l.startswith("\\unrestrict ")
        and not re.search(r"\bsandbox_exec\w*", l)]
OUT.write_text(HEADER + "\n".join(body) + "\n" + FOOTER, encoding="utf-8", newline="\n")

kinds = {}
for l in selected:
    entry = LINE.match(l).group(1)
    kind = next((k for k in TWO_WORD if entry.startswith(k + " ")), entry.split(" ")[0])
    kinds[kind] = kinds.get(kind, 0) + 1
print(f"{OUT.name} : {len(selected)} entrées", dict(sorted(kinds.items())))
