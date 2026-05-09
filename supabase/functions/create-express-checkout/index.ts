import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Stripe Payment Link (live) — accepte les codes de réduction.
const PAYMENT_LINK = "https://buy.stripe.com/bJe3cu4WU4uZ8z81DacMM0y";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, email, subscribeToNewsletter } = await req.json();
    if (!username || typeof username !== "string" || username.trim().length < 2) {
      throw new Error("Nom d'utilisateur TikTok invalide");
    }

    const cleanUsername = username.trim().replace(/^@/, "");
    const cleanEmail = email?.trim() || "";
    const wantsNewsletter = subscribeToNewsletter === true || subscribeToNewsletter === "true";

    // Pré-enregistre une intention d'analyse en DB (status=awaiting_payment).
    // L'id de cette ligne sert de client_reference_id sur le Payment Link
    // afin de récupérer username/email/newsletter après paiement.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );

    const { data: row, error: insertError } = await supabase
      .from("express_analyses")
      .insert({
        tiktok_username: cleanUsername,
        email: cleanEmail || null,
        newsletter_requested: wantsNewsletter,
        status: "awaiting_payment",
      })
      .select("id")
      .single();

    if (insertError || !row) {
      throw new Error(`Impossible d'enregistrer l'intention: ${insertError?.message ?? "inconnu"}`);
    }

    const params = new URLSearchParams({ client_reference_id: row.id });
    if (cleanEmail) params.set("prefilled_email", cleanEmail);
    const url = `${PAYMENT_LINK}?${params.toString()}`;

    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
