import { db, headers, json } from "../_shared/commerce.ts";

// Lecture du rapport par son lien secret (e-mail). Aucune autre donnée de commande n'est exposée.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  try {
    const { token, action } = await req.json();
    if (typeof token !== "string" || !/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(token)) {
      return json({ error: "Lien invalide" }, 400);
    }
    const client = db();
    const { data, error } = await client.from("video_analyses")
      .select("id, status, tiktok_url, report_data, completed_at, report_viewed_at, pdf_downloaded_at")
      .eq("report_token", token).maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "Rapport introuvable" }, 404);

    const ready = ["completed", "delivered"].includes(data.status) && data.report_data;
    if (!ready) {
      return json({
        status: data.status === "failed" || data.status === "refunded" ? "failed" : "processing",
        tiktok_url: data.tiktok_url,
      });
    }

    // Premier affichage et premier PDF : repères du funnel, sans donnée personnelle.
    const now = new Date().toISOString();
    if (action === "pdf" && !data.pdf_downloaded_at) {
      await client.from("video_analyses").update({ pdf_downloaded_at: now }).eq("id", data.id).is("pdf_downloaded_at", null);
      console.log(`[video-analysis] order=${data.id} pdf downloaded`);
    } else if (action !== "pdf" && !data.report_viewed_at) {
      await client.from("video_analyses").update({ report_viewed_at: now }).eq("id", data.id).is("report_viewed_at", null);
      console.log(`[video-analysis] order=${data.id} report viewed`);
    }
    if (action === "pdf") return json({ ok: true });
    return json({ status: "ready", tiktok_url: data.tiktok_url, completed_at: data.completed_at, report: data.report_data });
  } catch (e) {
    console.error("[video-analysis] report read failed", e instanceof Error ? e.message : e);
    return json({ error: "Consultation temporairement indisponible. Réessaie dans un instant." }, 500);
  }
});
