import { enqueue, site, type Database } from "./commerce.ts";

/**
 * Mail de livraison de l'Analyse Express. Le PDF est produit dans le navigateur
 * du client : le mail pointe donc vers sa page de résultat, où le rapport
 * s'affiche et se télécharge en PDF.
 */

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function expressResultMailHtml(username: string, url: string, score?: number | null) {
  const user = esc(username.replace(/^@+/, ""));
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#faf7f2;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e0d5;border-radius:12px;padding:28px">
    <h1 style="margin:0 0 16px;font-size:22px;color:#b8892b">Ton analyse est prête</h1>
    <p style="margin:0 0 14px;font-size:15px;color:#1a1a1a;line-height:1.6">
      Le rapport d'Analyse Express du compte <strong>@${user}</strong> est disponible.${
    typeof score === "number" ? ` Score de santé : <strong>${score}/100</strong>.` : ""
  }
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#1a1a1a;line-height:1.6">
      Ouvre ta page de résultat pour le consulter et télécharger le PDF complet.
    </p>
    <p style="margin:0 0 24px">
      <a href="${esc(url)}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:8px;font-size:15px;font-weight:bold">Voir mon rapport et télécharger le PDF</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#6b6257;line-height:1.6">
      Si le bouton ne fonctionne pas, copie ce lien : <br />${esc(url)}
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#6b6257;line-height:1.6">
      Une question sur le rapport - réponds à ce mail, Fred te répond sous deux jours ouvrés.
    </p>
  </div>
</div>`;
}

export async function sendExpressResultMail(client: Database, row: {
  id: string;
  email: string | null;
  tiktok_username: string;
  stripe_session_id: string | null;
  health_score?: number | null;
  result_email_sent_at?: string | null;
}) {
  if (!row.email || !row.stripe_session_id || row.result_email_sent_at) return false;
  const url = `${site()}/analyse-express/result?session_id=${encodeURIComponent(row.stripe_session_id)}`;
  await enqueue(
    client,
    `express-result:${row.id}`,
    row.email,
    `Ton analyse TikTok @${row.tiktok_username.replace(/^@+/, "")} est prête`,
    expressResultMailHtml(row.tiktok_username, url, row.health_score),
  );
  // Marque l'envoi même si la file rejoue : le dedupe_key empêche tout doublon.
  await client.from("express_analyses").update({ result_email_sent_at: new Date().toISOString() })
    .eq("id", row.id).is("result_email_sent_at", null);
  return true;
}
