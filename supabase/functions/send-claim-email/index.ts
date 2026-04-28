import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "https://esm.sh/nodemailer@6.9.16";
import { notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_LABELS: Record<string, string> = {
  acces: "Wav Academy · Accès",
  live: "Wav Academy · Live",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Service-role only (called by stripe-webhook)
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authHeader || !serviceKey || !authHeader.includes(serviceKey)) {
    return new Response(
      JSON.stringify({ error: "Service role required" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
    );
  }

  try {
    const { email, token, plan_type } = await req.json();
    if (!email || !token) throw new Error("Missing email or token");

    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
    if (!SMTP_PASSWORD) throw new Error("SMTP_PASSWORD not configured");

    const siteUrl = Deno.env.get("SITE_URL") || "https://fredwav.com";
    const claimUrl = `${siteUrl}/claim/${token}`;
    const planLabel = PLAN_LABELS[plan_type] || "Wav Academy";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #f5f0e8;">
        <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #c8a97e;">
          <h1 style="color: #c8a97e; margin: 0; font-size: 24px;">🎉 Bienvenue dans le ${planLabel}</h1>
        </div>
        <div style="padding: 30px 0;">
          <p style="color: #f5f0e8; font-size: 16px; line-height: 1.6;">
            Ton paiement est confirmé. Il ne te reste qu'<strong style="color: #c8a97e;">une étape</strong> pour activer ton accès Discord.
          </p>
          <p style="color: #f5f0e8; font-size: 16px; line-height: 1.6;">
            Clique sur le bouton ci-dessous, connecte-toi avec ton compte Discord, et ton rôle ${planLabel} sera attribué automatiquement.
          </p>
          <div style="text-align: center; padding: 30px 0;">
            <a href="${claimUrl}" style="background: #c8a97e; color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              Activer mon accès Discord
            </a>
          </div>
          <p style="color: #999; font-size: 13px; line-height: 1.6;">
            Ce lien est <strong style="color: #c8a97e;">unique</strong> et valable <strong style="color: #c8a97e;">7 jours</strong>. Conserve cet email jusqu'à activation.
          </p>
          <p style="color: #999; font-size: 13px; line-height: 1.6;">
            Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br/>
            <a href="${claimUrl}" style="color: #c8a97e; word-break: break-all;">${claimUrl}</a>
          </p>
        </div>
        <div style="border-top: 1px solid #333; padding-top: 20px; text-align: center;">
          <p style="color: #666; font-size: 12px;">FredWav · Coaching TikTok · noreply@fredwav.com</p>
        </div>
      </div>`;

    const transporter = nodemailer.createTransport({
      host: "ssl0.ovh.net",
      port: 465,
      secure: true,
      auth: { user: "noreply@fredwav.com", pass: SMTP_PASSWORD },
    });

    await transporter.sendMail({
      from: "FredWav <noreply@fredwav.com>",
      to: email,
      subject: `🎉 Active ton accès ${planLabel}`,
      html: htmlBody,
    });

    console.log(`Claim email sent to ${email} (token=${token})`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-claim-email error:", error);
    await notifyError("Send Claim Email", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
