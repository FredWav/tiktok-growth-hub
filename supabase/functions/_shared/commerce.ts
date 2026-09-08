import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import * as nodemailer from "https://esm.sh/nodemailer@6.9.16";

export const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
export const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers });
export const db = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
export type Database = ReturnType<typeof db>;
export const VERSION = "2026-09-08";
export const CALENDAR = "https://calendar.app.google/UZC5UY38shFuSqmy6";
export const site = () => Deno.env.get("SITE_URL") || "https://fredwav.com";
export const CGV_TEXT =
  "J'ai lu et j'accepte les CGV et le récapitulatif de ma commande, avec sa date de démarrage.";
export const EARLY_TEXT =
  "Je demande le commencement à la date convenue, avant la fin des 14 jours. Pour le service, une rétractation reste soumise au prorata de ce qui est fourni ; la perte du droit intervient après exécution complète. Pour les contenus numériques Academy, je demande leur accès à cette date et reconnais perdre le droit de rétractation sur ces contenus dès cet accès.";
export function text(value: unknown, min = 1, max = 2000): string {
  if (
    typeof value !== "string" || value.trim().length < min ||
    value.trim().length > max
  ) throw new Error("Champ invalide");
  return value.trim();
}
export function email(value: unknown) {
  const result = text(value, 3, 254).toLowerCase();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(result)) {
    throw new Error("Email invalide");
  }
  return result;
}
export function uuid(value: unknown): string {
  const result = text(value, 36, 36);
  if (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(result)) {
    throw new Error("Référence invalide");
  }
  return result;
}
export function service(req: Request) {
  return !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") &&
    req.headers.get("Authorization") ===
      `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
}
export async function admin(req: Request, client: Database) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (!token) throw new Error("Accès refusé");
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Accès refusé");
  const role = await client.from("user_roles").select("role").eq(
    "user_id",
    data.user.id,
  ).eq("role", "admin").maybeSingle();
  if (!role.data) throw new Error("Accès refusé");
  return data.user.id;
}
export async function fingerprint(req: Request) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(
      Deno.env.get("CONSENT_FINGERPRINT_KEY") ||
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    ),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(
      req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
    ),
  );
  return Array.from(
    new Uint8Array(digest),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
export async function enqueue(
  client: Database,
  key: string,
  recipient: string,
  subject: string,
  body: string,
) {
  const { error } = await client.from("commerce_mail").upsert({
    dedupe_key: key,
    recipient,
    subject,
    body,
  }, { onConflict: "dedupe_key", ignoreDuplicates: true });
  if (error) throw error;
}
export async function deliverMail(client: Database) {
  const deadline = Date.now() + 30000;
  const { data, error } = await client.from("commerce_mail").select("*")
    .or(
      `state.in.(pending,failed),and(state.eq.sending,locked_until.lt.${
        new Date().toISOString()
      })`,
    )
    .lt("attempts", 5).order("created_at").limit(10);
  if (error) throw error;
  for (const item of data || []) {
    if (Date.now() > deadline) break;
    const { data: owned, error: lockError } = await client.from("commerce_mail")
      .update({
        state: "sending",
        locked_until: new Date(Date.now() + 120000).toISOString(),
        attempts: item.attempts + 1,
      })
      .eq("id", item.id).eq("attempts", item.attempts).select("id")
      .maybeSingle();
    if (lockError || !owned) continue;
    try {
      if (!Deno.env.get("SMTP_PASSWORD")) throw new Error("SMTP non configuré");
      const mail = nodemailer.createTransport({
        host: "ssl0.ovh.net",
        port: 465,
        secure: true,
        connectionTimeout: 10000,
        socketTimeout: 20000,
        auth: {
          user: "noreply@fredwav.com",
          pass: Deno.env.get("SMTP_PASSWORD"),
        },
      });
      await mail.sendMail({
        from: "Fred Wav <noreply@fredwav.com>",
        replyTo: "contact@fredwav.com",
        to: item.recipient,
        subject: item.subject,
        text: item.body,
        messageId: `<${item.id}@fredwav.com>`,
      });
      const { error: sentError } = await client.from("commerce_mail").update({
        state: "sent",
        sent_at: new Date().toISOString(),
        error: null,
      }).eq("id", item.id);
      if (sentError) throw sentError;
    } catch (err) {
      await client.from("commerce_mail").update({
        state: "failed",
        error: String(err).slice(0, 500),
      }).eq("id", item.id);
    }
  }
}
