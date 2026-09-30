import { db, headers, json, cronCaller, deliverMail } from "../_shared/commerce.ts";
import { pollExpress, flagExpressSupport, type ExpressRow } from "../_shared/express-finalize.ts";
import { sendExpressResultMail } from "../_shared/express-result-mail.ts";

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null,{headers});
  if (!cronCaller(req)) return json({ error: "Accès refusé" },403);
  const client = db(), summary = { checked: 0, errors: 0 };
  const deadline=Date.now()+25000;
  try {
    const { data, error } = await client.from("express_analyses").select("*")
      .or("status.in.(processing,starting),and(status.eq.pending,job_id.not.is.null)")
      .order("updated_at").limit(30);
    if (error) throw error;
    for (const row of (data || []) as ExpressRow[]) {
      if(Date.now()>deadline) break;
      try {
        await pollExpress(row, client); summary.checked++;
      } catch (e) {
        summary.errors++;
        await flagExpressSupport(row, String(e), client);
      } finally {
        // Errors must rotate too, otherwise the oldest broken jobs starve the queue.
        const { error: touchError } = await client.from("express_analyses")
          .update({ updated_at: new Date().toISOString() }).eq("id", row.id);
        if (touchError) { summary.errors++; console.error("Express queue rotation failed", touchError); }
      }
    }
    // Rattrapage des rapports terminés dont le mail de livraison manque.
    const pending = await client.from("express_analyses")
      .select("id,email,tiktok_username,stripe_session_id,health_score,result_email_sent_at")
      .eq("status", "complete").is("result_email_sent_at", null)
      .not("email", "is", null).not("stripe_session_id", "is", null)
      .gte("completed_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .order("completed_at").limit(20);
    if (pending.error) summary.errors++;
    for (const item of pending.data || []) {
      try {
        await sendExpressResultMail(client, item);
      } catch (e) {
        summary.errors++;
        console.error("Rattrapage mail rapport échoué", item.id, e);
      }
    }
    await deliverMail(client);
    return json(summary);
  } catch (e) { console.error(e); return json({ error: "Rattrapage à retenter", ...summary },500); }
});
