import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Find expired active subscriptions
    const { data: expired, error } = await supabase
      .from("vip_subscriptions")
      .select("*")
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString());

    if (error) throw error;

    console.log(`Found ${expired?.length || 0} expired VIP subscriptions`);

    let revokedCount = 0;

    for (const sub of expired || []) {
      // Revoke Discord role if granted
      if (sub.discord_user_id && sub.discord_role_granted) {
        try {
          const resp = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/discord-role`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              },
              body: JSON.stringify({
                action: "revoke",
                discordUserId: sub.discord_user_id,
              }),
            }
          );
          const result = await resp.json();
          console.log(`Revoke result for ${sub.discord_user_id}:`, result);
        } catch (err) {
          console.error(`Failed to revoke Discord role for ${sub.discord_user_id}:`, err);
        }
      }

      // Update status to expired
      await supabase
        .from("vip_subscriptions")
        .update({ status: "expired", discord_role_granted: false })
        .eq("id", sub.id);

      revokedCount++;
    }

    return new Response(
      JSON.stringify({ processed: revokedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check VIP expiry error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
