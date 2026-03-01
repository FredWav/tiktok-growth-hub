import Stripe from "https://esm.sh/stripe@18.5.0";
import nodemailer from "npm:nodemailer@6.9.16";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getStripeSecretKey } from "../_shared/stripe-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1476936142149390498/PWhNWcdB4iqoFrfF7dFAdhpeMDwuLPNjvGiuZxp_0ubpjdxncA2UFTHcXMZzPiXtT6Bg";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, whatsapp, tiktok, objectives, session_id } = await req.json();

    // Validation
    if (!name || !email || !whatsapp || !tiktok || !objectives || !session_id) {
      return new Response(JSON.stringify({ error: "Tous les champs sont obligatoires" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify payment with Stripe
    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Paiement non confirmé" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 1. Save to DB ──
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: dbError } = await supabaseAdmin
      .from("oneshot_submissions")
      .insert({
        stripe_session_id: session_id,
        name,
        email,
        whatsapp,
        tiktok,
        objectives,
      });

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Don't block — continue with Discord + email
    } else {
      console.log("Oneshot submission saved to DB");
    }

    // ── 2. Discord webhook ──
    try {
      const discordPayload = {
        content: "<@967099537439227965> <@826133033069051954> 🎯 **Nouvelle réservation One Shot !**",
        embeds: [
          {
            title: `${name}`,
            color: 0xc8a97e,
            fields: [
              { name: "📧 Email", value: email, inline: true },
              { name: "📱 WhatsApp", value: whatsapp, inline: true },
              { name: "🎵 TikTok", value: tiktok, inline: true },
              { name: "🎯 Objectifs", value: objectives.slice(0, 1024) },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload),
      });

      if (!discordRes.ok) {
        console.error("Discord webhook error:", discordRes.status, await discordRes.text());
      } else {
        console.log("Discord notification sent for", name);
      }
    } catch (discordErr) {
      console.error("Discord webhook failed:", discordErr);
      // Don't block
    }

    // ── 3. SMTP email (backup) ──
    try {
      const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
      if (SMTP_PASSWORD) {
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

        const transporter = nodemailer.createTransport({
          host: "ssl0.ovh.net",
          port: 465,
          secure: true,
          auth: {
            user: "noreply@fredwav.com",
            pass: SMTP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: "noreply@fredwav.com",
          to: "fredwavcm@gmail.com",
          subject: `🎯 Nouvelle réservation One Shot — ${name}`,
          html: htmlBody,
        });

        console.log("Email sent for", name);
      } else {
        console.warn("SMTP_PASSWORD not configured, skipping email");
      }
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
      // Don't block — data is saved in DB + Discord
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erreur interne du serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
