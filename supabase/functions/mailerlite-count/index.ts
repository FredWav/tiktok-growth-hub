import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROUP_ID = "183634214919341095";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("MAILERLITE_API_KEY");
    if (!apiKey) throw new Error("MAILERLITE_API_KEY not configured");

    const res = await fetch(`https://connect.mailerlite.com/api/groups/${GROUP_ID}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "MailerLite error");

    const count: number = data.data?.active_count ?? data.data?.total ?? 0;

    return new Response(JSON.stringify({ count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("mailerlite-count error:", err);
    return new Response(JSON.stringify({ count: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
