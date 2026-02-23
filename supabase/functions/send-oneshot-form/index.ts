import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, whatsapp, tiktok, objectives, session_id } = await req.json();

    // Validation
    if (!name || !email || !whatsapp || !tiktok || !objectives || !session_id) {
      return new Response(
        JSON.stringify({ error: "Tous les champs sont obligatoires" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify payment with Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Paiement non confirmé" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = (Deno.env.get("RESEND_API_KEY") || "").trim();
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Service email non configuré" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; border-bottom: 2px solid #c8a97e; padding-bottom: 10px;">
          🎯 Nouvelle réservation One Shot
        </h1>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; width: 140px;">Nom / Prénom</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Email</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">WhatsApp</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(whatsapp)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Compte TikTok</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(tiktok)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Objectifs</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${escapeHtml(objectives)}</td>
          </tr>
        </table>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "One Shot <onboarding@resend.dev>",
        to: ["fredwavcm@gmail.com"],
        subject: `🎯 Nouvelle réservation One Shot — ${name}`,
        html: htmlBody,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'envoi de l'email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
