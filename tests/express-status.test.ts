// Runs the real HTTP handler with fake Stripe, database and WavStats responses.
// No --allow-net permission: accidental external requests cannot reach production.
for (const [key, value] of Object.entries({
  SUPABASE_URL: "https://database.example.invalid",
  SUPABASE_SERVICE_ROLE_KEY: "fake-service-key",
  STRIPE_SECRET_KEY: "sk_test_fake",
  STRIPE_SECRET_KEY_TEST: "sk_test_fake",
  STRIPE_MODE: "test",
  ALLOW_TEST_FULFILLMENT: "true",
  WAVSTATS_API_KEY: "fake-partner-key",
})) Deno.env.set(key,value);

let handler: (req: Request) => Promise<Response>;
Object.defineProperty(Deno, "serve", { value: (callback: typeof handler) => { handler = callback; } });
await import("../supabase/functions/express-analysis-status/index.ts");

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
function mock(paid = true, found = true, complete = false) {
  const urls: string[] = [];
  globalThis.fetch = (input) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    urls.push(url.href);
    let body: unknown;
    if (url.host === "api.stripe.com") body = { id:"cs_test_own", payment_status: paid ? "paid" : "unpaid", livemode:false };
    else if (url.host === "database.example.invalid") {
      assert(url.searchParams.get("stripe_session_id") === "eq.cs_test_own", "Database lookup must use the verified Stripe session");
      body = found ? [{ id: "own-order", stripe_session_id: "cs_test_own", job_id: "own-job", status:complete ? "complete" : "processing", tiktok_username: "own-account", report_version:"legacy", created_at:new Date().toISOString(), processing_started_at:new Date().toISOString(), result_data: complete ? { marker: "own-saved-report" } : null }] : [];
    } else if (url.href === "https://wavstats.com/api/v1/jobs/own-job") body = { status:"processing", progress:50 };
    else throw new Error(`Unexpected request blocked: ${url.origin}${url.pathname}`);
    return Promise.resolve(Response.json(body));
  };
  return urls;
}
async function request() {
  return await handler(new Request("https://site.example.invalid/status", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({session_id:"cs_test_own",job_id:"another-customers-job"}) }));
}
Deno.test("Express : l'identifiant de traitement forgé est ignoré", async () => {
  const urls=mock(); const response=await request(); const result=await response.json();
  assert(response.ok && result.username === "own-account" && result.progress===50, "Own account must be returned");
  assert(urls.some(u=>u.endsWith("/jobs/own-job")), "Own job must be polled");
  assert(!urls.some(u=>u.includes("another-customers-job")), "Browser job must never reach an external service");
});
Deno.test("Express : aucun accès sans paiement confirmé", async () => {
  const urls=mock(false); const response=await request();
  assert(response.status===403 && urls.length===1, "Unpaid request must stop at Stripe");
  await response.body?.cancel();
});
Deno.test("Express : aucun repli vers le traitement du navigateur si commande absente", async () => {
  const urls=mock(true,false); const response=await request(); const result=await response.json();
  assert(result.status==="starting" && urls.length===2, "Unknown order cannot authorize a job");
});
Deno.test("Express : un ancien résultat reste lisible sans relancer WavStats", async () => {
  const urls=mock(true,true,true); const response=await request(); const result=await response.json();
  assert(result.data.marker==="own-saved-report" && urls.length===2, "Stored result must remain readable");
});
