/**
 * Envoi d'e-mails : un seul réglage pour toutes les fonctions.
 *
 * Secrets Supabase : SMTP_PASSWORD (obligatoire), SMTP_USER (adresse d'envoi,
 * noreply@fredwav.com par défaut), SMTP_HOST / SMTP_PORT (OVH par défaut).
 * L'expéditeur est toujours l'adresse authentifiée : OVH refuse les autres.
 */
import nodemailer from "https://esm.sh/nodemailer@6.9.16";

export function smtpSettings() {
  return {
    host: Deno.env.get("SMTP_HOST") || "ssl0.ovh.net",
    port: Number(Deno.env.get("SMTP_PORT") || 465),
    user: Deno.env.get("SMTP_USER") || "noreply@fredwav.com",
    configured: !!Deno.env.get("SMTP_PASSWORD"),
  };
}

/** « Fred Wav <adresse d'envoi> ». */
export function sender(name = "Fred Wav"): string {
  return `${name} <${smtpSettings().user}>`;
}

export function smtpTransport() {
  const password = Deno.env.get("SMTP_PASSWORD");
  if (!password) throw new Error("SMTP_PASSWORD non configuré");
  const { host, port, user } = smtpSettings();
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    connectionTimeout: 10000,
    socketTimeout: 20000,
    auth: { user, pass: password },
  });
}
