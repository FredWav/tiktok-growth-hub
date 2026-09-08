import { db, headers, json, service, deliverMail } from "../_shared/commerce.ts";
import { pollExpress, flagExpressSupport, type ExpressRow } from "../_shared/express-finalize.ts";

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null,{headers});
  if (!service(req)) return json({ error: "Accès refusé" },403);
  const client = db(), summary = { checked: 0, errors: 0 };
  const deadline=Date.now()+25000;
  try {
    const { data, error } = await client.from("express_analyses").select("*").in("status",["processing","starting"]).order("updated_at").limit(30);
    if (error) throw error;
    for (const row of (data || []) as ExpressRow[]) {
      if(Date.now()>deadline) break;
      try {
        await pollExpress(row); summary.checked++;
        await client.from("express_analyses").update({ updated_at: new Date().toISOString() }).eq("id",row.id);
      } catch (e) { summary.errors++; await flagExpressSupport(row,String(e)); }
    }
    await deliverMail(client);
    return json(summary);
  } catch (e) { console.error(e); return json({ error: "Rattrapage à retenter", ...summary },500); }
});
