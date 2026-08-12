import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.16";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DECLARATION_VERSION = "2026-08-11.v1";
const DECLARATION_TEXT =
  "Je notifie expressément ma décision de me rétracter du contrat identifié ci-dessus.";

const OFFER_LABELS: Record<string, string> = {
  analyse_express: "Analyse Express",
  wav_academy: "Wav Academy",
  wav_premium: "Wav Premium",
  other: "Autre prestation",
};

type DeliveryStatus = "pending" | "sent" | "failed";

type WithdrawalRow = {
  id: string;
  request_reference: string;
  customer_name: string;
  email: string;
  order_reference: string;
  offer: string;
  order_date: string | null;
  message: string | null;
  declaration_version: string;
  declaration_text: string;
  submitted_at: string;
  acknowledgement_status: DeliveryStatus;
  notification_status: DeliveryStatus;
  email_delivery_attempts: number;
  acknowledgement_sent_at: string | null;
  notification_sent_at: string | null;
};

type DeliveryOutcome = {
  acknowledgementStatus: DeliveryStatus;
  notificationStatus: DeliveryStatus;
  attempts: number;
  trackingError: string | null;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatParisDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "long",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function isServiceRoleRequest(req: Request, serviceRoleKey: string): boolean {
  return req.headers.get("authorization") === `Bearer ${serviceRoleKey}`;
}

async function getTechnicalFingerprint(req: Request, secret: string): Promise<string | null> {
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "";
  const userAgent = req.headers.get("user-agent") || "";
  if (!ipAddress && !userAgent) return null;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`fredwav-consent-fingerprint-v1|${ipAddress}|${userAgent}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function buildDeliveryMessages(row: WithdrawalRow) {
  const safeName = escapeHtml(row.customer_name);
  const safeEmail = escapeHtml(row.email);
  const safeOrderReference = escapeHtml(row.order_reference);
  const safeOffer = escapeHtml(OFFER_LABELS[row.offer] ?? "Autre prestation");
  const safeDeclaration = escapeHtml(row.declaration_text);
  const safeMessage = row.message
    ? escapeHtml(row.message).replaceAll("\n", "<br />")
    : "Aucun message complémentaire";
  const formattedReceivedAt = formatParisDate(row.submitted_at);

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1a1a1a;line-height:1.6">
      <h1 style="font-size:22px">Votre demande de rétractation a bien été reçue</h1>
      <p>Bonjour ${safeName},</p>
      <p>Nous accusons réception de votre demande le <strong>${escapeHtml(formattedReceivedAt)}</strong>.</p>
      <ul>
        <li>Référence de demande : <strong>${escapeHtml(row.request_reference)}</strong></li>
        <li>Commande : <strong>${safeOrderReference}</strong></li>
        <li>Prestation : <strong>${safeOffer}</strong></li>
      </ul>
      <h2 style="font-size:17px">Déclaration enregistrée</h2>
      <p><strong>Version :</strong> ${escapeHtml(row.declaration_version)}</p>
      <blockquote style="margin:12px 0;padding:12px;border-left:3px solid #c8a97e;background:#f7f3ed">${safeDeclaration}</blockquote>
      <p>Conservez cet email. La demande sera vérifiée au regard de la date de commande, de l'état d'exécution de la prestation et des exceptions légales applicables. Cet accusé de réception ne vaut pas confirmation automatique d'un remboursement.</p>
      <p>Une question ? Répondez à cet email ou écrivez à <a href="mailto:contact@fredwav.com">contact@fredwav.com</a>.</p>
      <p style="color:#666;font-size:12px">Fred Wav · Frédéric Olalde EI · SIRET 921 749 727 00019</p>
    </div>`;

  const customerText = [
    "Votre demande de rétractation a bien été reçue",
    `Reçue le : ${formattedReceivedAt}`,
    `Référence : ${row.request_reference}`,
    `Commande : ${row.order_reference}`,
    `Prestation : ${OFFER_LABELS[row.offer] ?? "Autre prestation"}`,
    `Déclaration — version ${row.declaration_version}`,
    row.declaration_text,
    "Conservez cet email. Cet accusé de réception ne vaut pas confirmation automatique d'un remboursement.",
  ].join("\n\n");

  const ownerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1a1a1a;line-height:1.6">
      <h1 style="font-size:22px">Nouvelle demande de rétractation</h1>
      <ul>
        <li>Référence : <strong>${escapeHtml(row.request_reference)}</strong></li>
        <li>Reçue le : ${escapeHtml(formattedReceivedAt)}</li>
        <li>Client : ${safeName} (${safeEmail})</li>
        <li>Commande : ${safeOrderReference}</li>
        <li>Prestation : ${safeOffer}</li>
        <li>Date de commande déclarée : ${row.order_date ? escapeHtml(row.order_date) : "non renseignée"}</li>
        <li>Déclaration : ${safeDeclaration} (${escapeHtml(row.declaration_version)})</li>
      </ul>
      <p><strong>Message facultatif :</strong><br />${safeMessage}</p>
      <p>Contrôler l'éligibilité et traiter la demande dans Supabase avec la référence ci-dessus.</p>
    </div>`;

  const ownerText = [
    "Nouvelle demande de rétractation",
    `Référence : ${row.request_reference}`,
    `Reçue le : ${formattedReceivedAt}`,
    `Client : ${row.customer_name} (${row.email})`,
    `Commande : ${row.order_reference}`,
    `Prestation : ${OFFER_LABELS[row.offer] ?? "Autre prestation"}`,
    `Date de commande déclarée : ${row.order_date ?? "non renseignée"}`,
    `Déclaration — version ${row.declaration_version} : ${row.declaration_text}`,
    `Message facultatif : ${row.message ?? "aucun"}`,
  ].join("\n\n");

  return { customerHtml, customerText, ownerHtml, ownerText };
}

async function updateDeliveryState(
  supabase: SupabaseClient,
  row: WithdrawalRow,
  values: Record<string, unknown>,
): Promise<string | null> {
  const { error } = await supabase
    .from("withdrawal_requests")
    .update(values)
    .eq("id", row.id);
  if (!error) return null;
  console.error("withdrawal delivery state update failed:", error);
  return error.message;
}

async function deliverPendingEmails(
  supabase: SupabaseClient,
  row: WithdrawalRow,
): Promise<DeliveryOutcome> {
  const sendAcknowledgement = row.acknowledgement_status !== "sent";
  const sendNotification = row.notification_status !== "sent";
  if (!sendAcknowledgement && !sendNotification) {
    return {
      acknowledgementStatus: "sent",
      notificationStatus: "sent",
      attempts: row.email_delivery_attempts,
      trackingError: null,
    };
  }

  const attemptAt = new Date().toISOString();
  const attempts = row.email_delivery_attempts + 1;
  const smtpPassword = Deno.env.get("SMTP_PASSWORD") ?? "";
  const notificationEmail = Deno.env.get("WITHDRAWAL_NOTIFICATION_EMAIL") || "contact@fredwav.com";

  if (!smtpPassword) {
    const deliveryError = "SMTP_PASSWORD non configuré";
    const acknowledgementStatus = sendAcknowledgement ? "failed" : row.acknowledgement_status;
    const notificationStatus = sendNotification ? "failed" : row.notification_status;
    const trackingError = await updateDeliveryState(supabase, row, {
      acknowledgement_status: acknowledgementStatus,
      notification_status: notificationStatus,
      email_delivery_attempts: attempts,
      last_delivery_attempt_at: attemptAt,
      email_delivery_error: deliveryError,
      updated_at: attemptAt,
    });
    return { acknowledgementStatus, notificationStatus, attempts, trackingError };
  }

  const transporter = nodemailer.createTransport({
    host: "ssl0.ovh.net",
    port: 465,
    secure: true,
    auth: { user: "noreply@fredwav.com", pass: smtpPassword },
  });
  const messages = buildDeliveryMessages(row);

  const acknowledgementPromise = sendAcknowledgement
    ? transporter.sendMail({
        from: "Fred Wav <noreply@fredwav.com>",
        to: row.email,
        replyTo: "contact@fredwav.com",
        subject: `Rétractation reçue — ${row.request_reference}`,
        text: messages.customerText,
        html: messages.customerHtml,
      })
    : Promise.resolve(null);
  const notificationPromise = sendNotification
    ? transporter.sendMail({
        from: "FredWav.com <noreply@fredwav.com>",
        to: notificationEmail,
        replyTo: row.email,
        subject: `[Rétractation] ${row.request_reference} — ${OFFER_LABELS[row.offer] ?? "Autre prestation"}`,
        text: messages.ownerText,
        html: messages.ownerHtml,
      })
    : Promise.resolve(null);

  const [acknowledgementDelivery, notificationDelivery] = await Promise.allSettled([
    acknowledgementPromise,
    notificationPromise,
  ]);
  const acknowledgementSent = !sendAcknowledgement || acknowledgementDelivery.status === "fulfilled";
  const notificationSent = !sendNotification || notificationDelivery.status === "fulfilled";
  const acknowledgementStatus: DeliveryStatus = acknowledgementSent ? "sent" : "failed";
  const notificationStatus: DeliveryStatus = notificationSent ? "sent" : "failed";
  const deliveryErrors: string[] = [];

  if (sendAcknowledgement && acknowledgementDelivery.status === "rejected") {
    deliveryErrors.push(`Accusé client : ${getErrorMessage(acknowledgementDelivery.reason)}`);
  }
  if (sendNotification && notificationDelivery.status === "rejected") {
    deliveryErrors.push(`Notification interne : ${getErrorMessage(notificationDelivery.reason)}`);
  }

  const trackingError = await updateDeliveryState(supabase, row, {
    acknowledgement_status: acknowledgementStatus,
    notification_status: notificationStatus,
    email_delivery_attempts: attempts,
    last_delivery_attempt_at: attemptAt,
    acknowledgement_sent_at: acknowledgementSent
      ? row.acknowledgement_sent_at ?? attemptAt
      : row.acknowledgement_sent_at,
    notification_sent_at: notificationSent
      ? row.notification_sent_at ?? attemptAt
      : row.notification_sent_at,
    email_delivery_error: deliveryErrors.length > 0 ? deliveryErrors.join(" | ").slice(0, 2_000) : null,
    updated_at: attemptAt,
  });

  return { acknowledgementStatus, notificationStatus, attempts, trackingError };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée" }, 405);
  }

  try {
    const body = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configuration Supabase manquante");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Action interne : rejoue uniquement les livraisons non confirmées, sans
    // modifier la déclaration ni recréer une demande. Jamais exposée au front.
    if (body?.action === "retry_delivery") {
      if (!isServiceRoleRequest(req, serviceRoleKey)) {
        return jsonResponse({ error: "Service role required" }, 403);
      }
      const requestReference = typeof body?.request_reference === "string"
        ? body.request_reference.trim()
        : "";
      if (!/^RET-\d{8}-[A-F0-9]{8}$/.test(requestReference)) {
        return jsonResponse({ error: "Référence de demande invalide" }, 400);
      }

      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("request_reference", requestReference)
        .maybeSingle();
      if (error) throw new Error(`Lecture de la demande impossible : ${error.message}`);
      if (!data) return jsonResponse({ error: "Demande introuvable" }, 404);

      const row = data as WithdrawalRow;
      const delivery = await deliverPendingEmails(supabase, row);
      return jsonResponse({
        success: delivery.trackingError === null,
        reference: row.request_reference,
        acknowledgement_status: delivery.acknowledgementStatus,
        notification_status: delivery.notificationStatus,
        delivery_attempts: delivery.attempts,
        tracking_error: delivery.trackingError,
      }, delivery.trackingError ? 500 : 200);
    }

    const customerName = typeof body?.customer_name === "string" ? body.customer_name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const orderReference = typeof body?.order_reference === "string" ? body.order_reference.trim() : "";
    const offer = typeof body?.offer === "string" ? body.offer : "";
    const orderDate = typeof body?.order_date === "string" && body.order_date ? body.order_date : null;
    const message = typeof body?.message === "string" && body.message.trim()
      ? body.message.trim()
      : null;

    if (body?.intent !== "withdraw") {
      return jsonResponse({ error: "Intention de rétractation non confirmée" }, 400);
    }
    if (
      body?.declaration_version !== DECLARATION_VERSION ||
      body?.declaration_text !== DECLARATION_TEXT
    ) {
      return jsonResponse(
        { error: "Le formulaire a été mis à jour. Rechargez la page avant de confirmer votre demande." },
        409,
      );
    }
    if (customerName.length < 2 || customerName.length > 120) {
      return jsonResponse({ error: "Nom invalide" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return jsonResponse({ error: "Adresse email invalide" }, 400);
    }
    if (orderReference.length < 2 || orderReference.length > 160) {
      return jsonResponse({ error: "Référence de commande invalide" }, 400);
    }
    if (!(offer in OFFER_LABELS)) {
      return jsonResponse({ error: "Prestation invalide" }, 400);
    }
    if (orderDate && !/^\d{4}-\d{2}-\d{2}$/.test(orderDate)) {
      return jsonResponse({ error: "Date de commande invalide" }, 400);
    }
    if (message && message.length > 2_000) {
      return jsonResponse({ error: "Le message est limité à 2 000 caractères" }, 400);
    }

    const fingerprintKey = Deno.env.get("CONSENT_FINGERPRINT_KEY") || serviceRoleKey;
    const technicalFingerprintHash = await getTechnicalFingerprint(req, fingerprintKey);

    // Limite les dépôts répétés sans empêcher un client de corriger sa demande.
    const cutoff = new Date(Date.now() - 30 * 60 * 1_000).toISOString();
    const { count: recentEmailCount } = await supabase
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("submitted_at", cutoff);

    if ((recentEmailCount ?? 0) >= 3) {
      return jsonResponse(
        { error: "Trop de demandes récentes. Votre précédente demande est déjà enregistrée." },
        429,
      );
    }

    if (technicalFingerprintHash) {
      const { count: recentFingerprintCount } = await supabase
        .from("withdrawal_requests")
        .select("id", { count: "exact", head: true })
        .eq("technical_fingerprint_hash", technicalFingerprintHash)
        .gte("submitted_at", cutoff);
      if ((recentFingerprintCount ?? 0) >= 10) {
        return jsonResponse({ error: "Trop de demandes récentes. Réessayez plus tard." }, 429);
      }
    }

    const compactDate = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const requestReference = `RET-${compactDate}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const { data: requestRow, error: insertError } = await supabase
      .from("withdrawal_requests")
      .insert({
        request_reference: requestReference,
        customer_name: customerName,
        email,
        order_reference: orderReference,
        offer,
        order_date: orderDate,
        message,
        declaration_version: DECLARATION_VERSION,
        declaration_text: DECLARATION_TEXT,
        technical_fingerprint_hash: technicalFingerprintHash,
      })
      .select("*")
      .single();

    if (insertError || !requestRow) {
      throw new Error(`Impossible d'enregistrer la demande : ${insertError?.message ?? "inconnu"}`);
    }

    const row = requestRow as WithdrawalRow;
    const delivery = await deliverPendingEmails(supabase, row);
    return jsonResponse({
      success: true,
      reference: row.request_reference,
      received_at: row.submitted_at,
      email_sent: delivery.acknowledgementStatus === "sent",
      acknowledgement_status: delivery.acknowledgementStatus,
      notification_status: delivery.notificationStatus,
      delivery_attempts: delivery.attempts,
      delivery_tracking_error: delivery.trackingError,
    }, 201);
  } catch (error) {
    console.error("withdrawal-request error:", error);
    return jsonResponse({ error: getErrorMessage(error) }, 500);
  }
});
