import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("MAILERLITE_API_KEY");
    if (!apiKey) throw new Error("MAILERLITE_API_KEY not configured");

    // Use limit=0 to get only the aggregate total of active subscribers
    // (account-wide, not tied to a specific group).
    // See: https://developers.mailerlite.com/docs/subscribers.html
    const res = await fetch(
      "https://connect.mailerlite.com/api/subscribers?limit=0&filter[status]=active",
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "MailerLite error");

    // The limit=0 response exposes `total` at the root. Keep a few fallbacks
    // in case MailerLite tweaks the shape.
    const count: number =
      data.total ??
      data.meta?.total ??
      data.data?.total ??
      (Array.isArray(data.data) ? data.data.length : 0);

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
