import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

/**
 * Base PGlite chargée avec les migrations du dépôt (migration de référence de la
 * production + évolutions v2). Les schémas gérés par Supabase (auth, storage) et
 * les extensions indisponibles dans PGlite (pg_cron, pg_net) sont remplacés par
 * des bouchons minimaux : seul le schéma public est réellement testé.
 */
const STUBS = `
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE ROLE supabase_auth_admin;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT null::uuid';
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'SELECT null::text';
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS 'SELECT null::jsonb';
CREATE SCHEMA storage;
CREATE TABLE storage.buckets(id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
CREATE TABLE storage.objects(id uuid, bucket_id text, name text, owner uuid);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS 'SELECT string_to_array($1, ''/'')';
CREATE SCHEMA extensions;
`;

const MIGRATIONS = new URL("../supabase/migrations/", import.meta.url);

export async function migrationSql() {
  const files = (await readdir(MIGRATIONS)).filter((f) => f.endsWith(".sql")).sort();
  const parts = await Promise.all(files.map((f) => readFile(new URL(f, MIGRATIONS), "utf8")));
  return parts.join("\n");
}

export async function referenceDatabase() {
  const db = new PGlite();
  await db.exec(STUBS);
  const sql = (await migrationSql()).replace(/^CREATE EXTENSION.*$/gm, "");
  await db.exec(sql);
  // La migration de référence désactive search_path (pg_dump) : on le rétablit pour les tests.
  await db.exec("SET search_path TO public, extensions");
  return db;
}
