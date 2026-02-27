import nodemailer from "npm:nodemailer@6.9.16";

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
    const { first_name, last_name, email, tiktok_username, current_level, blockers, goals, budget_confirmed } = await req.json();

    if (!first_name || !last_name || !email) {
      return new Response(JSON.stringify({ error: "Champs obligatoires manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
    if (!SMTP_PASSWORD) {
      console.error("SMTP_PASSWORD not configured");
      return new Response(JSON.stringify({ error: "Service email non configuré" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; border-bottom: 2px solid #c8a97e; padding-bottom: 10px;">
          📋 Nouvelle candidature Wav Premium
        </h1>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; width: 140px;">Prénom</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(first_name)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Nom</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(last_name)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Email</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">TikTok</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${tiktok_username ? escapeHtml(tiktok_username) : "—"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Niveau</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(current_level || "")}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Budget confirmé</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${budget_confirmed ? "✅ Oui" : "❌ Non"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Blockers</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${escapeHtml(blockers || "")}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Objectifs</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${escapeHtml(goals || "")}</td>
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
      subject: `📋 Nouvelle candidature Wav Premium — ${first_name} ${last_name}`,
      html: htmlBody,
    });

    console.log(`Notification email sent for ${first_name} ${last_name}`);

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
