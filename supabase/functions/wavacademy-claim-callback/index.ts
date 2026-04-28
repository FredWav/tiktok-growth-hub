import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { notifyError, notifySuccess } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function redirectTo(url: string) {
  return new Response(null, { status: 302, headers: { ...corsHeaders, Location: url } });
}

function errorRedirect(siteUrl: string, code: string) {
  return redirectTo(`${siteUrl}/claim/error?reason=${encodeURIComponent(code)}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const siteUrl = Deno.env.get("SITE_URL") || "https://fredwav.com";

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const token = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");

    if (oauthError) {
      console.warn("Discord OAuth user-cancel/error:", oauthError);
      return errorRedirect(siteUrl, oauthError);
    }

    if (!code || !token) return errorRedirect(siteUrl, "missing_params");

    const clientId = Deno.env.get("DISCORD_CLIENT_ID");
    const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET");
    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_GUILD_ID");
    const redirectUri = Deno.env.get("DISCORD_OAUTH_REDIRECT_URI");

    if (!clientId || !clientSecret || !botToken || !guildId || !redirectUri) {
      console.error("Missing Discord env vars");
      await notifyError("Claim Callback", "Variables Discord manquantes côté serveur");
      return errorRedirect(siteUrl, "server_misconfigured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Validate token
    const { data: claim, error: claimErr } = await supabase
      .from("wavacademy_claims")
      .select("token, subscription_id, plan_type, discord_role_env, expires_at, claimed_at, email")
      .eq("token", token)
      .maybeSingle();

    if (claimErr || !claim) return errorRedirect(siteUrl, "invalid_token");
    if (claim.claimed_at) return redirectTo(`${siteUrl}/wavacademy?claimed=already`);
    if (new Date(claim.expires_at).getTime() < Date.now()) return errorRedirect(siteUrl, "expired");

    // Resolve role id
    const roleId = Deno.env.get(claim.discord_role_env);
    if (!roleId) {
      await notifyError("Claim Callback", `Role env var introuvable: ${claim.discord_role_env}`);
      return errorRedirect(siteUrl, "role_missing");
    }

    // Exchange code → access_token
    const tokenForm = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenForm.toString(),
    });
    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error("Discord token exchange failed:", tokenRes.status, txt);
      await notifyError("Claim Callback", `Token exchange échoué (${tokenRes.status})`);
      return errorRedirect(siteUrl, "oauth_exchange_failed");
    }
    const tokenJson = await tokenRes.json();
    const userAccessToken: string = tokenJson.access_token;

    // Get the user's Discord id
    const meRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${userAccessToken}` },
    });
    if (!meRes.ok) {
      const txt = await meRes.text();
      console.error("Discord users/@me failed:", meRes.status, txt);
      return errorRedirect(siteUrl, "discord_me_failed");
    }
    const me = await meRes.json();
    const discordUserId: string = me.id;

    // Add member to guild with the role pre-assigned (works whether or not the user is already a member)
    const joinRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: userAccessToken,
          roles: [roleId],
        }),
      }
    );

    // 201 Created = member added; 204 No Content = already a member (and roles in body were applied
    // for new members; for existing members we need to PATCH their roles separately).
    if (joinRes.status === 204) {
      // User was already in the guild — assign the role explicitly
      const patchRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bot ${botToken}` },
        }
      );
      if (!patchRes.ok && patchRes.status !== 204) {
        const txt = await patchRes.text();
        console.error("Discord role PUT failed:", patchRes.status, txt);
        await notifyError("Claim Callback", `Assignation rôle échouée (${patchRes.status})`);
        return errorRedirect(siteUrl, "role_assign_failed");
      }
    } else if (!joinRes.ok && joinRes.status !== 201) {
      const txt = await joinRes.text();
      console.error("Discord guilds.join failed:", joinRes.status, txt);
      await notifyError("Claim Callback", `guilds.join échoué (${joinRes.status})`);
      return errorRedirect(siteUrl, "guild_join_failed");
    }

    // Mark claim as completed and update subscription
    await supabase
      .from("wavacademy_claims")
      .update({ claimed_at: new Date().toISOString(), discord_user_id: discordUserId })
      .eq("token", token);

    if (claim.subscription_id) {
      await supabase
        .from("wavacademy_subscriptions")
        .update({ discord_user_id: discordUserId, discord_role_granted: true })
        .eq("id", claim.subscription_id);
    }

    await notifySuccess(
      "WavAcademy",
      `Rôle attribué • ${claim.plan_type} • ${claim.email} • Discord ${discordUserId}`
    );

    return redirectTo(`${siteUrl}/wavacademy?claimed=true`);
  } catch (error) {
    console.error("claim-callback error:", error);
    await notifyError("Claim Callback", error.message);
    return errorRedirect(siteUrl, "exception");
  }
});
