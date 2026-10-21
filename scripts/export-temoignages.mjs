/**
 * Copie des témoignages publiés (fiches actives de l'admin) dans
 * src/data/temoignages.json, juste avant le build : les pages pré-rendues
 * contiennent ainsi les résultats et les vidéos (référencement), puis le site
 * relit la base en direct. Sans réseau, la copie existante est conservée.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "src", "data", "temoignages.json");
const env = { ...loadEnv(process.env.MODE || "production", root, "VITE_"), ...process.env };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const COLUMNS = "id,name,avatar_url,tiktok_url,offers,display_order,niche,metric,result,result_detail,youtube_id,tiktok_video_id,video_caption,featured,anonymous";

try {
  if (!url || !key) throw new Error("adresse ou clé publique Supabase absente");
  const res = await fetch(`${url}/rest/v1/trusted_clients?select=${COLUMNS}&is_active=eq.true&order=display_order.asc,name.asc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rows = await res.json();
  await writeFile(out, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  console.log(`[témoignages] ${rows.length} fiches copiées dans src/data/temoignages.json`);
} catch (error) {
  console.warn(`[témoignages] copie non mise à jour (${error.message}) : la version existante est utilisée.`);
}
