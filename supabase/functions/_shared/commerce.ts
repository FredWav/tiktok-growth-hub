import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { sender, smtpTransport } from "./smtp.ts";
import { CONTACT_EMAIL, withNoReplyHtml, withNoReplyText } from "./mail-notice.ts";
import { OWNER_EMAIL as OWNER } from "./owner.ts";
// File d'e-mails et utilitaires sans dépendance réseau : importables par les tests Node.
export { enqueue, missingCommerceTable, site } from "./mail-queue.ts";
import { missingCommerceTable } from "./mail-queue.ts";

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
export { CGV_TEXT, earlyText, EARLY_TEXT, VERSION } from "./consent-texts.ts";
export { OWNER_EMAIL } from "./owner.ts";
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
// Le cron pg_cron s'authentifie par en-tête dédié : sans cela la file d'emails
// n'était jamais vidée (403 à chaque exécution planifiée).
export function cronCaller(req: Request) {
  const secret = Deno.env.get("RECONCILE_CRON_SECRET");
  return service(req) ||
    (!!secret && req.headers.get("x-cron-secret") === secret);
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
      const mail = smtpTransport();
      const isHtml = /<\w+[^>]*>/.test(item.body);
      const textFallback = item.body
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(tr|p|div|h1|h2)>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      // Clients : rappel de ne pas répondre à noreply@ et de passer par contact@.
      const toClient = String(item.recipient).trim().toLowerCase() !== OWNER;
      const html = toClient ? withNoReplyHtml(item.body) : item.body;
      const text = (body: string) => toClient ? withNoReplyText(body) : body;
      await mail.sendMail({
        from: sender(),
        replyTo: CONTACT_EMAIL,
        to: item.recipient,
        subject: item.subject,
        ...(isHtml ? { html, text: text(textFallback) } : { text: text(item.body) }),
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

// Le socle commerce v3 n'est pas encore en base : consigner un paiement à rapprocher
// ne doit jamais faire échouer le webhook (Stripe retenterait en boucle).
export async function logUnmatchedPayment(client: Database, payload: {
  session_id: string;
  reason: string;
  amount_cents: number | null;
  currency: string | null;
  email?: string | null;
  received_at: string;
}) {
  const { error } = await client.from("commerce_unmatched_payments").upsert(
    payload,
    { onConflict: "session_id", ignoreDuplicates: true },
  );
  if (error && !missingCommerceTable(error)) throw error;
  if (error) {
    console.error("commerce_unmatched_payments absente:", payload.session_id, payload.reason);
  }
}
