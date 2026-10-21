/**
 * Reprise des données de la production Lovable vers une base v2.
 *
 *   Répétition sur une copie jetable (en mémoire, schéma = toutes les migrations) :
 *     node scripts/reprise-donnees.mjs <export.backup>
 *   Reprise réelle (fredwav-prod, déjà migrée et vide) :
 *     DATABASE_URL=postgresql://… node scripts/reprise-donnees.mjs <export.backup>
 *
 * - Le même fichier SQL est chargé dans les deux cas : la répétition valide exactement
 *   ce qui sera exécuté le jour J.
 * - Refus si une table reprise contient déjà des données (pas de double reprise).
 * - Chargement tout ou rien, déclencheurs désactivés (aucun e-mail ni traitement ne part).
 * - Contrôles : lignes table par table, clés étrangères orphelines, résumé métier.
 *   Aucune donnée personnelle n'est affichée.
 * - Non repris : comptes (recréés à la main) et ancien système de réservation et de
 *   diagnostic, archivé dans ARCHIVE_DIR (défaut ../fredwav-archives, hors dépôt).
 *
 * - Adresses des images (témoignages, captures) : réécrites vers NEW_SUPABASE_URL
 *   (le projet cible) ; les fichiers eux-mêmes sont copiés par reprise-fichiers.mjs.
 *
 * Variables : DATABASE_URL, NEW_SUPABASE_URL, PG_BIN (outils PostgreSQL), ARCHIVE_DIR.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const dump = process.argv[2];
if (!dump || !existsSync(dump)) {
  console.error("Usage : [DATABASE_URL=…] node scripts/reprise-donnees.mjs <export.backup>");
  process.exit(1);
}
const url = process.env.DATABASE_URL;
const bin = process.env.PG_BIN || "C:\\Program Files\\PostgreSQL\\17\\bin";
const tool = (name) => path.join(bin, process.platform === "win32" ? `${name}.exe` : name);
// Projet Lovable de production : ses adresses de fichiers publics sont réécrites.
const OLD_SUPABASE_URL = "https://rdpykyvqcckxpygwblxf.supabase.co";
const newSupabaseUrl = (process.env.NEW_SUPABASE_URL || (url ? "" : "https://copie.invalid")).replace(/\/$/, "");
if (!/^https:\/\/[a-z0-9.-]+$/.test(newSupabaseUrl)) {
  console.error("NEW_SUPABASE_URL manquant ou invalide (ex. https://xxxx.supabase.co).");
  process.exit(1);
}
const archiveDir = process.env.ARCHIVE_DIR || path.resolve(process.cwd(), "..", "fredwav-archives");
const run = (cmd, args, options = {}) =>
  execFileSync(tool(cmd), args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 1024, ...options });

// Comptes admin : recréés à la main (liés à auth.users, non repris).
const ACCOUNTS = ["profiles", "user_roles"];
// Ancien système de réservation et de diagnostic : archivé, non repris.
const ARCHIVED = ["availability_slots", "bookings", "diagnostic_leads", "oneshot_submissions"];

// Réglages de session de pg_dump : les lignes relues ont le même texte que l'export.
const DUMP_SETTINGS = ["SET TimeZone = 'UTC';", "SET DateStyle = 'ISO, YMD';", "SET IntervalStyle = 'postgres';", "SET extra_float_digits = 3;"];

// --- Accès à la base : psql (réel) ou copie en mémoire (répétition) -----------------
async function connect() {
  if (url) {
    const psql = (args) => run("psql", ["--no-psqlrc", "-X", "-q", "-v", "ON_ERROR_STOP=1", url, ...args]);
    return {
      label: "base réelle",
      // Sous Windows, psql termine ses lignes par CRLF.
      rows: async (sql) => psql(["-At", "-F", "\t", "-c", sql]).replace(/\r\n/g, "\n").split("\n").filter(Boolean).map((l) => l.split("\t")),
      load: async (file) => { psql(["--single-transaction", "-f", file]); },
      copyOut: async (table, columns) =>
        psql([...DUMP_SETTINGS.map((c) => ["-c", c]).flat(), "-c", `COPY public."${table}" (${columns}) TO STDOUT`])
          .replace(/\r\n/g, "\n"),
      close: async () => {},
    };
  }
  const { referenceDatabase } = await import("../tests/reference-db.mjs");
  const db = await referenceDatabase();
  const { readFileSync } = await import("node:fs");
  return {
    label: "copie jetable en mémoire",
    rows: async (sql) => (await db.query(sql, [], { rowMode: "array" })).rows.map((r) => r.map((v) => v === null ? "" : String(v))),
    load: async (file) => { await db.exec(`BEGIN;\n${readFileSync(file, "utf8")}\nCOMMIT;`); },
    copyOut: async (table, columns) => {
      await db.exec(DUMP_SETTINGS.join(" "));
      const result = await db.query(`COPY public."${table}" (${columns}) TO '/dev/blob'`);
      return result.blob ? await result.blob.text() : "";
    },
    close: () => db.close(),
  };
}

// --- Format COPY (texte) → valeurs SQL ---------------------------------------------
const ESCAPES = { b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v" };
function copyField(raw) {
  if (raw === "\\N") return "NULL";
  const text = raw.replace(/\\(x[0-9a-fA-F]{1,2}|[0-7]{1,3}|.)/g, (_, e) => {
    if (e[0] === "x") return String.fromCharCode(parseInt(e.slice(1), 16));
    if (/^[0-7]/.test(e)) return String.fromCharCode(parseInt(e, 8));
    return ESCAPES[e] ?? e;
  });
  return `'${text.replace(/'/g, "''")}'`;
}

async function main() {
  const listing = run("pg_restore", ["-l", dump]);
  const exported = [...listing.matchAll(/TABLE DATA public (\S+) /g)].map((m) => m[1]);
  const tables = exported.filter((t) => !ACCOUNTS.includes(t) && !ARCHIVED.includes(t)).sort();

  const work = mkdtempSync(path.join(os.tmpdir(), "fredwav-reprise-"));
  const db = await connect();
  try {
    const present = new Set((await db.rows("SELECT tablename FROM pg_tables WHERE schemaname='public'")).map((r) => r[0]));
    const missing = tables.filter((t) => !present.has(t));
    if (missing.length) throw new Error(`Tables absentes de la base cible : ${missing.join(", ")}`);
    const filled = [];
    for (const t of tables) if (Number((await db.rows(`SELECT count(*) FROM public."${t}"`))[0][0]) > 0) filled.push(t);
    if (filled.length) throw new Error(`Données déjà présentes dans : ${filled.join(", ")}. Reprise refusée.`);

    // Données des tables reprises, converties en INSERT (identique pour les deux cibles).
    const copy = run("pg_restore", ["--data-only", "--no-owner", "--no-privileges", "-n", "public",
      ...tables.flatMap((t) => ["-t", t]), "-f", "-", dump])
      // Sous Windows, pg_restore écrit des fins de ligne CRLF ; dans les données, un
      // retour chariot réel est toujours échappé (\r), on peut donc normaliser sans risque.
      .replace(/\r\n/g, "\n");
    const expected = {};
    const source = {};
    const statements = ["SET session_replication_role = replica;"];
    for (const m of copy.matchAll(/^COPY public\.("?)([a-z_0-9]+)\1 \(([^)]*)\) FROM stdin;\n([\s\S]*?)^\\\.$/gm)) {
      const [, , table, columns, body] = m;
      const lines = body === "" ? [] : body.replace(/\n$/, "").split("\n");
      expected[table] = lines.length;
      source[table] = { columns, lines };
      for (let i = 0; i < lines.length; i += 200) {
        const values = lines.slice(i, i + 200).map((l) => `(${l.split("\t").map(copyField).join(",")})`);
        statements.push(`INSERT INTO public."${table}" (${columns}) VALUES\n${values.join(",\n")};`);
      }
    }
    // Garde-fous : chaque table reprise doit avoir été lue, et la reprise ne peut être vide.
    const unread = tables.filter((t) => !(t in expected));
    if (unread.length) throw new Error(`Données illisibles dans l'export pour : ${unread.join(", ")}`);
    if (!Object.values(expected).some((n) => n > 0)) throw new Error("Export vide : reprise refusée.");
    statements.push(
      "SET session_replication_role = origin;",
      // Commandes historiques closes : la tâche planifiée n'a plus rien à y faire.
      "UPDATE public.commerce_orders SET automation_done = true WHERE status IN ('cancelled','expired');",
      // Images publiques : adresse du nouveau projet (fichiers copiés par reprise-fichiers.mjs).
      `UPDATE public.trusted_clients SET avatar_url = replace(avatar_url, '${OLD_SUPABASE_URL}/', '${newSupabaseUrl}/') WHERE avatar_url LIKE '${OLD_SUPABASE_URL}/%';`,
      `UPDATE public.client_screenshots SET image_url = replace(image_url, '${OLD_SUPABASE_URL}/', '${newSupabaseUrl}/') WHERE image_url LIKE '${OLD_SUPABASE_URL}/%';`,
    );
    const file = path.join(work, "reprise.sql");
    writeFileSync(file, statements.join("\n"), "utf8");

    // Archive de l'ancien système (hors dépôt, contient des données personnelles).
    const archived = ARCHIVED.filter((t) => exported.includes(t));
    if (archived.length) {
      mkdirSync(archiveDir, { recursive: true });
      run("pg_restore", ["--data-only", "--no-owner", "-n", "public", ...archived.flatMap((t) => ["-t", t]),
        "-f", path.join(archiveDir, `ancien-systeme-${path.basename(dump, path.extname(dump))}.sql`), dump]);
    }

    console.log(`Cible : ${db.label}. Chargement de ${tables.length} tables…`);
    await db.load(file);

    // Contrôles.
    let problems = 0;
    console.log("\nTable\tExport\tBase\tÉtat");
    for (const t of tables) {
      const got = Number((await db.rows(`SELECT count(*) FROM public."${t}"`))[0][0]);
      const ok = got === (expected[t] ?? 0);
      if (!ok) problems++;
      console.log(`${t}\t${expected[t] ?? 0}\t${got}\t${ok ? "ok" : "ÉCART"}`);
    }
    const fks = await db.rows(`
      SELECT c.conname, c.conrelid::regclass::text, c.confrelid::regclass::text,
        (SELECT string_agg(format('c.%I', a.attname), ',' ORDER BY k.ord) FROM unnest(c.conkey) WITH ORDINALITY k(n, ord)
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.n),
        (SELECT string_agg(format('p.%I', a.attname), ',' ORDER BY k.ord) FROM unnest(c.confkey) WITH ORDINALITY k(n, ord)
          JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.n)
      FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE c.contype = 'f' AND n.nspname = 'public'`);
    const broken = [];
    for (const [name, child, parent, ccols, pcols] of fks) {
      if (parent.startsWith("auth.")) continue; // comptes recréés à la main
      const n = Number((await db.rows(
        `SELECT count(*) FROM ${child} c WHERE ROW(${ccols}) IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ${parent} p WHERE ROW(${pcols}) = ROW(${ccols}))`,
      ))[0][0]);
      if (n) broken.push(`${name} (${n})`);
    }
    problems += broken.length;
    // Contenu : chaque ligne relue doit être identique, caractère pour caractère, à l'export.
    const altered = [];
    for (const t of tables) {
      if (!source[t]?.lines.length) continue;
      const back = (await db.copyOut(t, source[t].columns)).replace(/\n$/, "").split("\n").sort();
      // Seules les adresses d'images des témoignages et captures sont réécrites.
      const rewritten = ["trusted_clients", "client_screenshots"].includes(t);
      const before = source[t].lines
        .map((l) => rewritten ? l.split(`${OLD_SUPABASE_URL}/`).join(`${newSupabaseUrl}/`) : l).sort();
      const diff = before.filter((line, i) => line !== back[i]).length + Math.abs(before.length - back.length);
      if (diff) altered.push(`${t} (${diff})`);
    }
    problems += altered.length;
    console.log(`\nContenu ligne à ligne : ${altered.length ? `différences dans ${altered.join(", ")}` : "identique à l'export"}`);
    console.log(`Clés étrangères vérifiées : ${fks.length}, orphelines : ${broken.length ? broken.join(", ") : "aucune"}`);

    console.log("\nRésumé métier :");
    const summary = [
      ["Commandes d'accompagnement par état", "SELECT coalesce(string_agg(s || ' ' || n, ', '), 'aucune') FROM (SELECT status s, count(*) n FROM commerce_orders GROUP BY 1 ORDER BY 1) x"],
      ["Encaissements accompagnements (€)", "SELECT coalesce(sum(amount_cents),0)/100.0 FROM commerce_receipts"],
      ["Accès Academy actifs (dont sans date de fin)", "SELECT count(*) || ' (' || count(*) FILTER (WHERE access_expires_at IS NULL) || ')' FROM wavacademy_subscriptions WHERE status='active'"],
      ["Analyses Express par état", "SELECT coalesce(string_agg(s || ' ' || n, ', '), 'aucune') FROM (SELECT status s, count(*) n FROM express_analyses GROUP BY 1 ORDER BY 1) x"],
      ["Analyses vidéo par état", "SELECT coalesce(string_agg(s || ' ' || n, ', '), 'aucune') FROM (SELECT status s, count(*) n FROM video_analyses GROUP BY 1 ORDER BY 1) x"],
      ["E-mails encore en file (seront envoyés par la v2)", "SELECT count(*) FROM commerce_mail WHERE state IN ('pending','sending','failed') AND attempts < 5"],
      ["Adresses d'images restées sur l'ancien projet", `SELECT (SELECT count(*) FROM trusted_clients WHERE avatar_url LIKE '${OLD_SUPABASE_URL}%') + (SELECT count(*) FROM client_screenshots WHERE image_url LIKE '${OLD_SUPABASE_URL}%')`],
      ["Compteur Analyse Express affiché", "SELECT 224 + public.express_paid_since()"],
      ["Compteur Analyse vidéo affiché", "SELECT 47 + public.video_paid_since()"],
    ];
    for (const [label, sql] of summary) console.log(`- ${label} : ${(await db.rows(sql))[0][0]}`);
    console.log(problems ? `\n${problems} problème(s) : ne pas basculer avant correction.` : "\nReprise conforme.");
    process.exitCode = problems ? 2 : 0;
  } finally {
    await db.close();
    rmSync(work, { recursive: true, force: true });
  }
}

await main();
