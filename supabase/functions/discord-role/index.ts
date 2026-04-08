import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // This function is internal-only: restrict to service-role key
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authHeader || !serviceKey || !authHeader.includes(serviceKey)) {
    return new Response(
      JSON.stringify({ error: "Service role required" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
    );
  }

  try {
    // roleId can be passed directly (for multi-role support) or resolved from env
    const { action, discordUserId, roleId: roleIdParam } = await req.json();

    if (!action || !discordUserId) {
      throw new Error("Missing action or discordUserId");
    }

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_GUILD_ID");
    // Use explicitly passed roleId first, then fall back to legacy env var
    const roleId = roleIdParam || Deno.env.get("DISCORD_VIP_ROLE_ID");

    if (!botToken || !guildId || !roleId) {
      throw new Error("Discord configuration missing");
    }

    const url = `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`;
    const method = action === "grant" ? "PUT" : "DELETE";

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      console.error(`Discord API error: ${response.status} - ${errorText}`);
      throw new Error(`Discord API error: ${response.status}`);
    }

    if (response.status !== 204) {
      await response.text();
    }

    console.log(`Discord role ${action} successful for user ${discordUserId}`);

    return new Response(
      JSON.stringify({ success: true, action, discordUserId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Discord role error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
