/**
 * Copie des fichiers stockés de la production Lovable vers le projet cible.
 *
 *   Vérification seule (aucun envoi) :
 *     node scripts/reprise-fichiers.mjs <export.backup>
 *   Copie réelle :
 *     NEW_SUPABASE_URL=https://xxxx.supabase.co NEW_SERVICE_ROLE_KEY=… HOOKS_DIR=<dossier> \
 *       node scripts/reprise-fichiers.mjs <export.backup>
 *
 * - La liste des fichiers vient de l'export (storage.objects).
 * - Buckets publics (photos des témoignages, captures) : téléchargés depuis le site actuel.
 * - Packs de hooks (bucket privé) : lus dans HOOKS_DIR, puisque Lovable ne donne pas
 *   accès au stockage privé. Chaque fichier est contrôlé (taille) avant envoi.
 * - Un fichier déjà présent dans la cible n'est jamais écrasé.
 * - Seuls des nombres sont affichés (les noms de fichiers peuvent contenir des noms de clients).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const dump = process.argv[2];
if (!dump || !existsSync(dump)) {
  console.error("Usage : node scripts/reprise-fichiers.mjs <export.backup>");
  process.exit(1);
}
const OLD_SUPABASE_URL = "https://rdpykyvqcckxpygwblxf.supabase.co";
const PUBLIC_BUCKETS = ["trusted-avatars", "client-screenshots"];
const PRIVATE_BUCKETS = ["hooks-packs"];
const target = (process.env.NEW_SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.NEW_SERVICE_ROLE_KEY || "";
const hooksDir = process.env.HOOKS_DIR || "";
const send = !!(target && key);
const bin = process.env.PG_BIN || "C:\\Program Files\\PostgreSQL\\17\\bin";

// Liste des fichiers depuis l'export (format COPY texte).
const copy = execFileSync(path.join(bin, process.platform === "win32" ? "pg_restore.exe" : "pg_restore"),
  ["--data-only", "-n", "storage", "-t", "objects", "-f", "-", dump], { encoding: "utf8", maxBuffer: 1 << 28 })
  .replace(/\r\n/g, "\n");
const block = copy.match(/^COPY storage\.objects \(([^)]*)\) FROM stdin;\n([\s\S]*?)^\\\.$/m);
if (!block) throw new Error("Liste des fichiers introuvable dans l'export.");
const columns = block[1].split(", ");
const unescape = (v) => v === "\\N" ? null : v.replace(/\\(.)/g, (_, c) => ({ n: "\n", t: "\t", r: "\r" })[c] ?? c);
const objects = block[2].replace(/\n$/, "").split("\n").filter(Boolean).map((line) => {
  const values = line.split("\t").map(unescape);
  const row = Object.fromEntries(columns.map((c, i) => [c, values[i]]));
  const meta = row.metadata ? JSON.parse(row.metadata) : {};
  return { bucket: row.bucket_id, name: row.name, size: Number(meta.size ?? -1), type: meta.mimetype || "application/octet-stream" };
}).filter((o) => [...PUBLIC_BUCKETS, ...PRIVATE_BUCKETS].includes(o.bucket));

const encodePath = (name) => name.split("/").map(encodeURIComponent).join("/");
const tally = {};
let problems = 0;
for (const o of objects) {
  const t = (tally[o.bucket] ??= { listed: 0, read: 0, sent: 0, present: 0, missing: 0 });
  t.listed++;
  let body;
  if (PUBLIC_BUCKETS.includes(o.bucket)) {
    const res = await fetch(`${OLD_SUPABASE_URL}/storage/v1/object/public/${o.bucket}/${encodePath(o.name)}`);
    if (res.ok) body = new Uint8Array(await res.arrayBuffer());
  } else if (hooksDir && existsSync(path.join(hooksDir, path.basename(o.name)))) {
    body = new Uint8Array(readFileSync(path.join(hooksDir, path.basename(o.name))));
  }
  if (!body || (o.size >= 0 && body.length !== o.size)) {
    t.missing++;
    problems++;
    continue;
  }
  t.read++;
  if (!send) continue;
  const res = await fetch(`${target}/storage/v1/object/${o.bucket}/${encodePath(o.name)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": o.type, "x-upsert": "false" },
    body,
  });
  if (res.ok) t.sent++;
  else if (res.status === 409 || (await res.text()).includes("Duplicate")) t.present++;
  else problems++;
}

console.log(send ? "Copie vers le projet cible :" : "Vérification seule (aucun envoi) :");
for (const [bucket, t] of Object.entries(tally)) {
  console.log(`- ${bucket} : ${t.listed} dans l'export, ${t.read} lus et conformes${send ? `, ${t.sent} envoyés, ${t.present} déjà présents` : ""}, ${t.missing} introuvables ou de taille différente`);
}
if (!hooksDir) console.log("  (packs de hooks : indiquer HOOKS_DIR, le dossier où se trouvent les fichiers des packs)");
console.log(problems ? `\n${problems} problème(s).` : "\nFichiers conformes.");
process.exitCode = problems ? 2 : 0;
