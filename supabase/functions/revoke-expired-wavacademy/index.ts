import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Call the discord-role Edge Function to revoke a role. Returns true on success. */
async function revokeDiscordRole(discordUserId: string, roleEnvKey: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const roleId = Deno.env.get(roleEnvKey);

  if (!roleId) {
    console.warn(`Discord role env var not set: ${roleEnvKey}. Skipping revoke.`);
    return false;
  }

  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/discord-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ action: "revoke", discordUserId, roleId }),
    });
    const result = await resp.json();
    console.log(`Discord role revoke (${roleEnvKey}) for ${discordUserId}:`, result);
    return resp.ok;
  } catch (err) {
    console.error(`Failed to revoke Discord role for ${discordUserId}:`, err);
    return false;
  }
}

// Révoque l'accès des membres Wav Academy prépayés (3/6 mois) arrivés à échéance.
// Déclenché quotidiennement par pg_cron. Le 1 mois récurrent a access_expires_at = null
// et n'est donc jamais sélectionné ici — sa fin d'accès passe par customer.subscription.deleted.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const summary = { checked: 0, revoked: 0, expired_unclaimed: 0, errors: 0 };

  try {
    const nowIso = new Date().toISOString();

    const { data: rows, error } = await supabase
      .from("wavacademy_subscriptions")
      .select("id, email, discord_user_id, discord_role_env, discord_role_granted, access_expires_at")
      .eq("status", "active")
      .not("access_expires_at", "is", null)
      .lt("access_expires_at", nowIso);

    if (error) throw error;

    summary.checked = rows?.length || 0;

    for (const row of rows || []) {
      try {
        if (row.discord_role_granted && row.discord_user_id && row.discord_role_env) {
          const ok = await revokeDiscordRole(row.discord_user_id, row.discord_role_env);
          if (ok) summary.revoked++;
        } else {
          // Accès expiré mais jamais réclamé (pas de compte Discord lié) : rien à révoquer.
          summary.expired_unclaimed++;
        }

        await supabase
          .from("wavacademy_subscriptions")
          .update({ status: "expired", discord_role_granted: false })
          .eq("id", row.id);
      } catch (e) {
        console.error(`Error expiring subscription ${row.id}:`, e);
        summary.errors++;
      }
    }

    if (summary.revoked > 0 || summary.expired_unclaimed > 0 || summary.errors > 0) {
      await notifySuccess(
        "WavAcademy",
        `Accès expirés • révoqués=${summary.revoked} • non réclamés=${summary.expired_unclaimed} • erreurs=${summary.errors}`
      );
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("revoke-expired-wavacademy fatal:", e);
    await notifyError("Revoke Expired WavAcademy", e.message);
    return new Response(JSON.stringify({ error: e.message, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
