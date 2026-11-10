import { db, headers, json } from "../_shared/commerce.ts";
import { HOOKS_BUCKET, hooksPackFor } from "../_shared/hooks-delivery.ts";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const UUID_V4 = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: { ...headers, "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const input = await request.json().catch(() => null);
  const { token, file } = input ?? {};
  if (typeof token !== "string" || !UUID_V4.test(token)) return json({ error: "not_found" }, 404);
  if (file !== undefined && typeof file !== "string") return json({ error: "not_found" }, 404);

  try {
    const client = db();
    const { data: order, error } = await client.from("hooks_orders")
      .select("pack_code,paid_at").eq("access_token", token).maybeSingle();
    if (error) throw error;
    const pack = hooksPackFor({ produit: order?.pack_code });
    if (!order || !pack || Date.parse(order.paid_at) + YEAR_MS <= Date.now()) {
      return json({ error: "not_found" }, 404);
    }

    // Une consultation de la page, y compris par un outil de prévisualisation,
    // ne donne pas accès aux octets et ne constitue pas un téléchargement.
    if (file === undefined) return json({ name: pack.name, files: pack.files });
    if (!pack.files.some(({ path }) => path === file)) return json({ error: "not_found" }, 404);

    const { data: blob, error: storageError } = await client.storage.from(HOOKS_BUCKET).download(file);
    if (storageError || !blob?.size) throw new Error("Fichier indisponible dans le stockage");

    const { data: allowed, error: recordError } = await client.rpc("register_hooks_download", {
      p_access_token: token,
      p_file: file,
    });
    if (recordError) throw recordError;
    if (!allowed) return json({ error: "access_unavailable" }, 409);

    return new Response(blob, {
      headers: {
        ...headers,
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Téléchargement hooks indisponible", error instanceof Error ? error.message : "Erreur base de données");
    return json({ error: "unavailable" }, 503);
  }
});
