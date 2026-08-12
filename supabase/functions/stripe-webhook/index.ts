import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import nodemailer from "npm:nodemailer@6.9.16";
import { getStripeSecretKey } from "../_shared/stripe-config.ts";
import { notifySuccess, notifyError } from "../_shared/itpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

type ExpressConsentConfirmation = {
  email: string;
  tiktok_username: string;
  cgv_version: string;
  immediate_delivery_notice_version: string;
  cgv_accepted_text: string;
  immediate_delivery_accepted_text: string;
  accepted_at: string;
};

async function sendExpressOrderConfirmation(
  consent: ExpressConsentConfirmation,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const smtpPassword = Deno.env.get("SMTP_PASSWORD") || "";
  if (!smtpPassword) throw new Error("SMTP_PASSWORD non configuré");

  const siteUrl = Deno.env.get("SITE_URL") || "https://fredwav.com";
  const acceptedAt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "long",
    timeZone: "Europe/Paris",
  }).format(new Date(consent.accepted_at));
  const amount = typeof session.amount_total === "number"
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: (session.currency || "eur").toUpperCase(),
      }).format(session.amount_total / 100)
    : "montant indiqué sur votre reçu Stripe";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1a1a1a;line-height:1.6">
      <h1 style="font-size:22px">Confirmation de votre commande Analyse Express</h1>
      <p>Votre paiement de <strong>${escapeHtml(amount)}</strong> est confirmé pour l'analyse du compte <strong>@${escapeHtml(consent.tiktok_username)}</strong>.</p>
      <h2 style="font-size:18px">Consentements enregistrés avant paiement</h2>
      <p><strong>Acceptés le :</strong> ${escapeHtml(acceptedAt)}</p>
      <p><strong>Version des CGV :</strong> ${escapeHtml(consent.cgv_version)}</p>
      <blockquote style="margin:12px 0;padding:12px;border-left:3px solid #c8a97e;background:#f7f3ed">${escapeHtml(consent.cgv_accepted_text)}</blockquote>
      <p><strong>Version de l'information sur l'exécution immédiate :</strong> ${escapeHtml(consent.immediate_delivery_notice_version)}</p>
      <blockquote style="margin:12px 0;padding:12px;border-left:3px solid #c8a97e;background:#f7f3ed">${escapeHtml(consent.immediate_delivery_accepted_text)}</blockquote>
      <p><strong>Référence Stripe :</strong> ${escapeHtml(session.id)}</p>
      <p>Vous pouvez consulter les CGV applicables sur <a href="${siteUrl}/cgv">${siteUrl}/cgv</a> et exercer en ligne votre droit de rétractation sur <a href="${siteUrl}/retractation">${siteUrl}/retractation</a>, sous réserve des conditions et exceptions légales rappelées ci-dessus.</p>
      <p>Conservez cet email avec votre reçu Stripe.</p>
      <p style="color:#666;font-size:12px">Fred Wav · Frédéric Olalde EI · SIRET 921 749 727 00019</p>
    </div>`;

  const text = [
    "Confirmation de votre commande Analyse Express",
    `Paiement confirmé : ${amount}`,
    `Compte analysé : @${consent.tiktok_username}`,
    `Acceptés le : ${acceptedAt}`,
    `Version des CGV : ${consent.cgv_version}`,
    consent.cgv_accepted_text,
    `Version de l'information sur l'exécution immédiate : ${consent.immediate_delivery_notice_version}`,
    consent.immediate_delivery_accepted_text,
    `Référence Stripe : ${session.id}`,
    `CGV : ${siteUrl}/cgv`,
    `Rétractation : ${siteUrl}/retractation`,
  ].join("\n\n");

  const transporter = nodemailer.createTransport({
    host: "ssl0.ovh.net",
    port: 465,
    secure: true,
    auth: { user: "noreply@fredwav.com", pass: smtpPassword },
  });

  await transporter.sendMail({
    from: "Fred Wav <noreply@fredwav.com>",
    to: consent.email,
    replyTo: "contact@fredwav.com",
    subject: `Commande Analyse Express confirmée — ${session.id}`,
    text,
    html,
  });
}

async function safeNotifyError(title: string, message: string): Promise<void> {
  try {
    await notifyError(title, message);
  } catch (notifyErr) {
    console.error(`Failed to send error notification for ${title}:`, notifyErr);
  }
}

async function safeNotifySuccess(title: string, message: string): Promise<void> {
  try {
    await notifySuccess(title, message);
  } catch (notifyErr) {
    console.error(`Failed to send success notification for ${title}:`, notifyErr);
  }
}

async function triggerExpressAnalysis(sessionId: string): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const response = await fetch(`${supabaseUrl}/functions/v1/express-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok || response.status === 202) {
    const detail = (await response.text()).slice(0, 1_000);
    throw new Error(`Lancement du rapport impossible (${response.status}) : ${detail}`);
  }
}

/** Call the discord-role Edge Function to grant or revoke a role. */
async function assignDiscordRole(
  discordUserId: string,
  roleEnvKey: string,
  action: "grant" | "revoke"
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const roleId = Deno.env.get(roleEnvKey);

  if (!roleId) {
    console.warn(`Discord role env var not set: ${roleEnvKey}. Skipping role assignment.`);
    return;
  }

  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/discord-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ action, discordUserId, roleId }),
    });
    const result = await resp.json();
    console.log(`Discord role ${action} (${roleEnvKey}) for ${discordUserId}:`, result);
  } catch (err) {
    console.error(`Failed to ${action} Discord role for ${discordUserId}:`, err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const webhookSecretTest = Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST");
    const webhookSecrets = [webhookSecret, webhookSecretTest].filter(Boolean) as string[];
    const stripeSecretKey = getStripeSecretKey();

    if (!sig) {
      return jsonResponse({ error: "Stripe signature missing" }, 400);
    }

    if (!stripeSecretKey) {
      console.error("Stripe secret key missing. Webhook event ignored.");
      await safeNotifyError("Stripe Webhook", "Clé Stripe manquante - événement ignoré");
      return jsonResponse({ received: true, ignored: true, reason: "stripe_secret_key_missing" });
    }

    if (webhookSecrets.length === 0) {
      console.error("Stripe webhook signing secret missing. Webhook event ignored, but acknowledged to avoid retry storms.");
      await safeNotifyError("Stripe Webhook", "Secret de signature webhook manquant - événement ignoré");
      return jsonResponse({ received: true, ignored: true, reason: "webhook_secret_missing" });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Backend service credentials missing. Webhook event ignored.");
      await safeNotifyError("Stripe Webhook", "Credentials backend manquants - événement ignoré");
      return jsonResponse({ received: true, ignored: true, reason: "backend_credentials_missing" });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Vérifie d'abord avec le secret live ; en cas d'échec, tente le secret test (sandbox).
    // En Edge Function, Stripe doit utiliser la version async, sinon la crypto Web
    // déclenche "SubtleCryptoProvider cannot be used in a synchronous context".
    let verified: Stripe.Event | null = null;
    for (const secret of webhookSecrets) {
      try {
        verified = await stripe.webhooks.constructEventAsync(body, sig, secret);
        break;
      } catch (err) {
        console.warn("Stripe signature verification failed with one configured secret:", getErrorMessage(err));
      }
    }
    if (!verified) {
      return jsonResponse({ error: "Invalid Stripe signature" }, 400);
    }
    const event = verified;

    // ── Checkout terminé / paiement différé confirmé ──────────────────────
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      // Analyse Express : le client_reference_id pointe vers express_analyses.
      // On rattache la preuve de consentement à la session même si le client
      // ferme la page avant le retour navigateur vers /analyse-express/result.
      if (session.client_reference_id) {
        const { data: expressConsent, error: expressLookupError } = await supabase
          .from("express_purchase_consents")
          .select("id, email, tiktok_username, cgv_version, immediate_delivery_notice_version, cgv_accepted_text, immediate_delivery_accepted_text, accepted_at, confirmation_sent_at, checkout_mode")
          .eq("express_analysis_id", session.client_reference_id)
          .maybeSingle();

        if (expressLookupError) {
          console.error("Express consent lookup failed:", expressLookupError);
          await safeNotifyError(
            "Analyse Express Webhook",
            `Échec lecture consentement • session=${session.id}`,
          );
          return jsonResponse({ error: "Express consent lookup failed" }, 500);
        }

        if (expressConsent) {
          const checkoutIsTest = expressConsent.checkout_mode === "test";
          if (checkoutIsTest === event.livemode) {
            await safeNotifyError(
              "Analyse Express Webhook",
              `Incohérence mode consentement/Stripe • session=${session.id}`,
            );
            return jsonResponse({ error: "Express checkout mode mismatch" }, 500);
          }

          const linkedAt = new Date().toISOString();
          const { error: consentUpdateError } = await supabase
            .from("express_purchase_consents")
            .update({
              stripe_session_id: session.id,
              stripe_payment_status: session.payment_status,
              stripe_linked_at: linkedAt,
            })
            .eq("id", expressConsent.id);

          if (consentUpdateError) {
            console.error("Express consent Stripe link failed:", consentUpdateError);
            await safeNotifyError(
              "Analyse Express Webhook",
              `Échec liaison consentement/Stripe • session=${session.id}`,
            );
            return jsonResponse({ error: "Express consent link failed" }, 500);
          }

          // Ne marque l'analyse comme payée que lorsque Stripe le confirme.
          // express-analysis conserve sa propre vérification avant de lancer le rapport.
          if (session.payment_status === "paid") {
            const { error: analysisUpdateError } = await supabase
              .from("express_analyses")
              .update({ stripe_session_id: session.id })
              .eq("id", session.client_reference_id);

            if (analysisUpdateError) {
              console.error("Express analysis Stripe link failed:", analysisUpdateError);
              await safeNotifyError(
                "Analyse Express Webhook",
                `Échec liaison analyse/Stripe • session=${session.id}`,
              );
              return jsonResponse({ error: "Express analysis link failed" }, 500);
            }

            if (checkoutIsTest && Deno.env.get("ALLOW_TEST_FULFILLMENT") !== "true") {
              console.log(`Test Analyse Express linked without fulfilment: session=${session.id}`);
              return jsonResponse({
                received: true,
                linked: true,
                product: "analyse_express",
                fulfilment: "disabled_for_test",
              });
            }

            if (!expressConsent.confirmation_sent_at) {
              try {
                await sendExpressOrderConfirmation(
                  expressConsent as ExpressConsentConfirmation,
                  session,
                );
                const confirmationSentAt = new Date().toISOString();
                const { error: confirmationUpdateError } = await supabase
                  .from("express_purchase_consents")
                  .update({
                    confirmation_email: expressConsent.email,
                    confirmation_sent_at: confirmationSentAt,
                    confirmation_delivery_error: null,
                  })
                  .eq("id", expressConsent.id)
                  .is("confirmation_sent_at", null);

                if (confirmationUpdateError) {
                  console.error("Express confirmation marker failed:", confirmationUpdateError);
                  await safeNotifyError(
                    "Analyse Express Webhook",
                    `Email envoyé mais marqueur DB en échec • session=${session.id}`,
                  );
                }
              } catch (confirmationError) {
                const message = getErrorMessage(confirmationError).slice(0, 1_000);
                await supabase
                  .from("express_purchase_consents")
                  .update({ confirmation_delivery_error: message })
                  .eq("id", expressConsent.id);
                await safeNotifyError(
                  "Analyse Express Webhook",
                  `Échec confirmation contractuelle • session=${session.id} • ${message}`,
                );
                // Une réponse 5xx demande à Stripe de rejouer l'événement. Le guard
                // confirmation_sent_at empêche un nouvel envoi après un succès.
                return jsonResponse({ error: "Express confirmation email failed" }, 500);
              }
            }

            try {
              // Le rapport et la séquence opt-in doivent démarrer même si le
              // client ferme Stripe sans revenir sur la page résultat.
              await triggerExpressAnalysis(session.id);
            } catch (analysisTriggerError) {
              const message = getErrorMessage(analysisTriggerError);
              await safeNotifyError(
                "Analyse Express Webhook",
                `Échec lancement rapport • session=${session.id} • ${message}`,
              );
              return jsonResponse({ error: "Express analysis trigger failed" }, 500);
            }
          }

          console.log(
            `Analyse Express consent linked: analysis=${session.client_reference_id}, session=${session.id}, payment=${session.payment_status}`,
          );
          return jsonResponse({ received: true, linked: true, product: "analyse_express" });
        }
      }

      // Plan → Discord role env mapping (used when consent record drives the flow)
      const ROLE_ENV_BY_PLAN: Record<string, string> = {
        live: "DISCORD_VIP2_ROLE_ID",
      };

      // Resolve the wavacademy purchase context from one of two sources:
      //   (1) Legacy Edge Function checkout — info lives in session.metadata
      //   (2) Stripe Payment Link — info lives in wavacademy_consents
      //       keyed by session.client_reference_id
      let plan: string | null = null;
      let discordRoleEnv: string | null = null;
      let email: string | null = null;
      let consentId: string | null = null;
      let accessMonths: number | null = null;
      let academyCheckoutIsTest = !event.livemode;
      let consentCgvVersion: string | null = null;
      let consentCgvText: string | null = null;
      let consentDeliveryVersion: string | null = null;
      let consentDeliveryText: string | null = null;
      let consentAcceptedAt: string | null = null;

      if (metadata?.type?.startsWith("wavacademy_")) {
        plan = (metadata.plan as string) ?? null;
        discordRoleEnv = (metadata.discord_role_env as string) ?? null;
        email = (metadata.email as string) || session.customer_details?.email || null;
      } else if (session.client_reference_id) {
        const { data: consent } = await supabase
          .from("wavacademy_consents")
          .select("id, email, plan_type, access_months, consent_cgv, consent_renonciation, cgv_version, cgv_accepted_text, immediate_delivery_notice_version, immediate_delivery_accepted_text, accepted_at")
          .eq("id", session.client_reference_id)
          .maybeSingle();

        if (consent && consent.consent_cgv && consent.consent_renonciation) {
          consentId = consent.id;
          plan = consent.plan_type;
          accessMonths = consent.access_months ?? null;
          discordRoleEnv = ROLE_ENV_BY_PLAN[consent.plan_type] ?? null;
          email = consent.email || session.customer_details?.email || null;
          consentCgvVersion = consent.cgv_version ?? null;
          consentCgvText = consent.cgv_accepted_text ?? null;
          consentDeliveryVersion = consent.immediate_delivery_notice_version ?? null;
          consentDeliveryText = consent.immediate_delivery_accepted_text ?? null;
          consentAcceptedAt = consent.accepted_at ?? null;
          const consentIsTest = consent.cgv_version === "TEST";
          if (consentIsTest === event.livemode) {
            await safeNotifyError(
              "WavAcademy Webhook",
              `Incohérence mode consentement/Stripe • session=${session.id}`,
            );
            return jsonResponse({ error: "Wav Academy checkout mode mismatch" }, 500);
          }
          academyCheckoutIsTest = consentIsTest;

          // Link the Stripe session back onto the consent row (legal trail)
          const { error: consentLinkError } = await supabase
            .from("wavacademy_consents")
            .update({ stripe_session_id: session.id })
            .eq("id", consent.id);
          if (consentLinkError) {
            await safeNotifyError(
              "WavAcademy Webhook",
              `Échec liaison consentement/Stripe • session=${session.id}`,
            );
            return jsonResponse({ error: "Wav Academy consent link failed" }, 500);
          }
        }
      }

      if (!plan || !discordRoleEnv || !email) {
        console.log("Checkout session is not a Wav Academy purchase, skipping");
        return jsonResponse({ received: true });
      }

      if (session.payment_status !== "paid") {
        console.log(`WavAcademy payment pending: session=${session.id}, status=${session.payment_status}`);
        return jsonResponse({
          received: true,
          product: "wavacademy",
          fulfilment: "awaiting_payment",
        });
      }

      if (academyCheckoutIsTest && Deno.env.get("ALLOW_TEST_FULFILLMENT") !== "true") {
        console.log(`Test WavAcademy linked without fulfilment: session=${session.id}`);
        return jsonResponse({
          received: true,
          product: "wavacademy",
          fulfilment: "disabled_for_test",
        });
      }

      const stripeSubscriptionId = session.subscription as string | null;

      // Paiement unique prépayé (3/6 mois) : pas d'abonnement Stripe → on fixe une date
      // d'expiration que le cron revoke-expired-wavacademy utilisera pour retirer l'accès.
      // 1 mois récurrent : stripe_subscription_id renseigné → access_expires_at reste null
      // (la fin d'accès est pilotée par customer.subscription.deleted).
      let accessExpiresAt: string | null = null;
      if (!stripeSubscriptionId && accessMonths) {
        const exp = new Date();
        exp.setMonth(exp.getMonth() + accessMonths);
        accessExpiresAt = exp.toISOString();
      }

      console.log(`WavAcademy payment confirmed: plan=${plan}, months=${accessMonths ?? "n/a"}, recurring=${!!stripeSubscriptionId}, email=${email}, consent=${consentId ?? "n/a"}`);

      const subscriptionSelect = "id, access_months, access_expires_at, wavstats_provisioned_at, wavstats_activation_url, wavstats_error, activation_email_status, activation_email_attempted_at, activation_email_sent_at";
      let { data: subRow, error: subscriptionLookupError } = await supabase
        .from("wavacademy_subscriptions")
        .select(subscriptionSelect)
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (subscriptionLookupError) {
        console.error("Error reading wavacademy_subscription:", subscriptionLookupError);
        return jsonResponse({ error: "Wav Academy subscription lookup failed" }, 500);
      }

      let subscriptionCreated = false;
      if (!subRow) {
        const { data: insertedSubscription, error: insertError } = await supabase
          .from("wavacademy_subscriptions")
          .insert({
            stripe_session_id: session.id,
            stripe_subscription_id: stripeSubscriptionId,
            email,
            discord_user_id: null,
            discord_role_env: discordRoleEnv,
            plan_type: plan,
            access_months: accessMonths,
            access_expires_at: accessExpiresAt,
            status: "active",
            discord_role_granted: false,
          })
          .select(subscriptionSelect)
          .single();

        if (insertError) {
          // checkout.session.completed and async_payment_succeeded can overlap.
          // The unique stripe_session_id wins; the losing invocation reuses it.
          if (insertError.code === "23505") {
            const replayLookup = await supabase
              .from("wavacademy_subscriptions")
              .select(subscriptionSelect)
              .eq("stripe_session_id", session.id)
              .single();
            subRow = replayLookup.data;
            subscriptionLookupError = replayLookup.error;
          } else {
            subscriptionLookupError = insertError;
          }
        } else {
          subRow = insertedSubscription;
          subscriptionCreated = true;
        }
      }

      if (subscriptionLookupError || !subRow?.id) {
        console.error("Unable to create or reuse wavacademy_subscription:", subscriptionLookupError);
        await safeNotifyError("WavAcademy Webhook", `Échec accès DB • plan=${plan} • ${email}`);
        return jsonResponse({ error: "Wav Academy subscription persistence failed" }, 500);
      }

      accessMonths = subRow.access_months ?? accessMonths;
      accessExpiresAt = subRow.access_expires_at ?? accessExpiresAt;

      // Reuse an existing claim on webhook replay. If two Stripe events arrive
      // concurrently, a deterministic UUID makes the second insert collide on
      // the same token and then reuse that single row.
      let claimToken: string | null = null;
      const { data: existingClaim, error: existingClaimError } = await supabase
        .from("wavacademy_claims")
        .select("token")
        .eq("subscription_id", subRow.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingClaimError) {
        console.error("Error reading wavacademy_claim:", existingClaimError);
        return jsonResponse({ error: "Wav Academy claim lookup failed" }, 500);
      }

      if (existingClaim?.token) {
        claimToken = existingClaim.token as string;
      } else {
        const digest = new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(`fredwav-academy-claim-v1|${session.id}`),
          ),
        );
        const bytes = digest.slice(0, 16);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes).map((value) => value.toString(16).padStart(2, "0")).join("");
        const deterministicToken = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        const { data: claimRow, error: claimErr } = await supabase
          .from("wavacademy_claims")
          .insert({
            token: deterministicToken,
            subscription_id: subRow.id,
            email,
            plan_type: plan,
            discord_role_env: discordRoleEnv,
          })
          .select("token")
          .single();

        if (claimErr?.code === "23505") {
          const { data: concurrentClaim, error: concurrentClaimError } = await supabase
            .from("wavacademy_claims")
            .select("token")
            .eq("token", deterministicToken)
            .single();
          if (concurrentClaimError || !concurrentClaim) {
            console.error("Error reusing concurrent wavacademy_claim:", concurrentClaimError);
            return jsonResponse({ error: "Wav Academy claim persistence failed" }, 500);
          }
          claimToken = concurrentClaim.token as string;
        } else if (claimErr || !claimRow) {
          console.error("Error creating wavacademy_claim:", claimErr);
          await safeNotifyError("WavAcademy Webhook", `Échec création claim • ${email} • ${claimErr?.message ?? "no row"}`);
          return jsonResponse({ error: "Wav Academy claim persistence failed" }, 500);
        } else {
          claimToken = claimRow.token as string;
        }
      }

      // ── Provisioning WavStats (crédits inclus dans l'offre) ──────────────────
      // API Partenaires WavStats : une clé dans X-API-Key, plus de signature HMAC.
      // Leur back est du Node/Express derrière nginx, d'où l'URL en wavstats.com.
      //
      // Les trois blocages qui justifiaient le traitement manuel sont levés côté
      // WavStats : les crédits se rechargent chaque mois, l'accès s'arrête seul à
      // `expiresAt`, et le compte du membre reste ouvert après l'échéance.
      //
      // Reste désactivé tant que WAVSTATS_PARTNER_KEY et WAVSTATS_PARTNER_PLAN_ID
      // ne sont pas dans le dashboard : passer WAVSTATS_PROVISION_ENABLED à "true".
      let activationUrl: string | null = subRow.wavstats_activation_url ?? null;
      let wavstatsProvisioned = Boolean(subRow.wavstats_provisioned_at);
      let wavstatsError: string | null = subRow.wavstats_error ?? null;
      let wavstatsProvisionedThisAttempt = false;

      const provisionEnabled = Deno.env.get("WAVSTATS_PROVISION_ENABLED") === "true";
      // Clé partenaire, distincte de WAVSTATS_API_KEY (rapports / Analyse Express).
      const partnerKey = Deno.env.get("WAVSTATS_PARTNER_KEY");
      const partnerPlanId = Deno.env.get("WAVSTATS_PARTNER_PLAN_ID");

      // Un paiement sandbox (?test=1) consommerait une place réelle chez le
      // partenaire : on ne provisionne que sur les événements live.
      const canProvision = provisionEnabled && event.livemode && !!accessExpiresAt && !wavstatsProvisioned;

      if (canProvision && partnerKey && partnerPlanId) {
        // externalRef unique par vente : rappeler avec la même valeur ne crée pas
        // de doublon et ne redistribue pas de crédits, donc un rejeu est sans risque.
        const body = JSON.stringify({
          externalRef: session.id,
          email,
          planId: partnerPlanId,
          expiresAt: accessExpiresAt,
        });

        // 3 tentatives, backoff 1s / 4s. WavStats suggère 1/4/16 mais 16 s ferait
        // dépasser le délai de réponse au webhook Stripe ; en cas d'échec définitif,
        // rejouer l'appel à la main avec le même externalRef est idempotent.
        const BACKOFF_MS = [1000, 4000];
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await fetch("https://wavstats.com/api/v1/partners/subscriptions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": partnerKey,
              },
              body,
              signal: AbortSignal.timeout(20_000),
            });

            const text = await res.text();
            let parsed: Record<string, unknown> | null = null;
            try {
              parsed = JSON.parse(text);
            } catch {
              // Les pages d'erreur nginx sont en HTML, pas en JSON.
            }

            if (res.ok) {
              // activationUrl n'est renvoyée que pour un client qui découvre
              // WavStats. Absente = il avait déjà un compte, il se connecte
              // normalement — c'est un succès, pas un échec.
              wavstatsProvisioned = true;
              wavstatsProvisionedThisAttempt = true;
              activationUrl = (parsed?.activationUrl as string) ?? null;
              wavstatsError = null;
              console.log(
                `WavStats provisioning OK (essai ${attempt}) • ref=${session.id} • ${email} • HTTP ${res.status} • ${
                  activationUrl ? "lien d'activation émis" : "compte existant"
                }`,
              );
              break;
            }

            const code =
              (parsed?.error as { code?: string })?.code ??
              (parsed?.error as string) ??
              text.slice(0, 200);
            // TRY_AGAIN signale des appels concurrents, RATE_LIMITED un dépassement
            // du plafond de 60 appels par minute : les deux se retentent.
            const retryable =
              res.status >= 500 ||
              res.status === 429 ||
              res.status === 408 ||
              code === "TRY_AGAIN" ||
              code === "RATE_LIMITED";
            wavstatsError = `HTTP ${res.status} • ${code}`;

            // 405 avec du HTML = la requête n'a pas atteint l'app, elle est tombée
            // sur le fallback nginx.
            if (res.status === 405 && !parsed) {
              wavstatsError = "HTTP 405 (nginx) — la requête n'atteint pas l'application WavStats";
            }

            console.error(
              `WavStats provisioning échec (essai ${attempt}) • ref=${session.id} • ${email} • ${wavstatsError}`,
            );
            if (!retryable || attempt === 3) break;
          } catch (err) {
            wavstatsError = err instanceof Error ? err.message : String(err);
            console.error(
              `WavStats provisioning erreur réseau (essai ${attempt}) • ref=${session.id} • ${email} • ${wavstatsError}`,
            );
            if (attempt === 3) break;
          }
          await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt - 1]));
        }

        if (!wavstatsProvisioned) {
          await safeNotifyError(
            "WavAcademy Webhook",
            `⚠️ Provisioning WavStats ÉCHOUÉ • ${email} • ref=${session.id} • ${wavstatsError ?? "raison inconnue"} • créditer manuellement`,
          );
        }
      } else if (canProvision) {
        wavstatsError = partnerKey ? "WAVSTATS_PARTNER_PLAN_ID absent" : "WAVSTATS_PARTNER_KEY absent";
        await safeNotifyError(
          "WavAcademy Webhook",
          `⚠️ Provisioning WavStats activé mais mal configuré (${wavstatsError}) • créditer manuellement ${email}`,
        );
      }

      // Trace requêtable : sans ça, un échec ne vit que dans les logs et on ne peut
      // pas lister les membres restant à créditer à la main.
      if (subRow?.id) {
        await supabase
          .from("wavacademy_subscriptions")
          .update({
            wavstats_provisioned_at: wavstatsProvisioned ? new Date().toISOString() : null,
            wavstats_activation_url: activationUrl,
            wavstats_error: wavstatsError,
          })
          .eq("id", subRow.id);
      }

      let claimEmailSent = Boolean(subRow.activation_email_sent_at) || subRow.activation_email_status === "sent";
      let claimEmailSentThisAttempt = false;
      let claimEmailFailure: string | null = null;

      if (!claimEmailSent && claimToken) {
        const attemptAt = new Date().toISOString();
        const staleBefore = new Date(Date.now() - 10 * 60 * 1_000).toISOString();
        let { data: emailLock, error: emailLockError } = await supabase
          .from("wavacademy_subscriptions")
          .update({
            activation_email_status: "sending",
            activation_email_attempted_at: attemptAt,
            activation_email_error: null,
          })
          .eq("id", subRow.id)
          .in("activation_email_status", ["pending", "failed"])
          .select("id")
          .maybeSingle();

        // An invocation interrupted while sending must not lock delivery forever.
        if (!emailLock && !emailLockError) {
          const staleLock = await supabase
            .from("wavacademy_subscriptions")
            .update({
              activation_email_status: "sending",
              activation_email_attempted_at: attemptAt,
              activation_email_error: null,
            })
            .eq("id", subRow.id)
            .eq("activation_email_status", "sending")
            .lt("activation_email_attempted_at", staleBefore)
            .select("id")
            .maybeSingle();
          emailLock = staleLock.data;
          emailLockError = staleLock.error;
        }

        if (emailLockError) {
          console.error("Unable to acquire activation email lock:", emailLockError);
          return jsonResponse({ error: "Wav Academy email lock failed" }, 500);
        }

        if (emailLock) {
          try {
            const mailRes = await fetch(`${supabaseUrl}/functions/v1/send-claim-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                email,
                token: claimToken,
                plan_type: plan,
                access_months: accessMonths,
                wavstats_activation_url: activationUrl,
                wavstats_provisioned: wavstatsProvisioned,
                stripe_session_id: session.id,
                cgv_version: consentCgvVersion,
                cgv_accepted_text: consentCgvText,
                immediate_delivery_notice_version: consentDeliveryVersion,
                immediate_delivery_accepted_text: consentDeliveryText,
                accepted_at: consentAcceptedAt,
              }),
            });

            if (!mailRes.ok) {
              throw new Error(`HTTP ${mailRes.status}: ${(await mailRes.text()).slice(0, 300)}`);
            }

            const { error: sentMarkerError } = await supabase
              .from("wavacademy_subscriptions")
              .update({
                activation_email_status: "sent",
                activation_email_sent_at: new Date().toISOString(),
                activation_email_error: null,
              })
              .eq("id", subRow.id)
              .eq("activation_email_status", "sending");
            if (sentMarkerError) {
              throw new Error(`Email envoyé mais marqueur DB en échec: ${sentMarkerError.message}`);
            }
            claimEmailSent = true;
            claimEmailSentThisAttempt = true;
          } catch (mailErr) {
            claimEmailFailure = getErrorMessage(mailErr).slice(0, 1_000);
            console.error("Failed to invoke send-claim-email:", mailErr);
            await supabase
              .from("wavacademy_subscriptions")
              .update({
                activation_email_status: "failed",
                activation_email_error: claimEmailFailure,
              })
              .eq("id", subRow.id);
            await safeNotifyError(
              "WavAcademy Webhook",
              `🚨 Email d'activation NON ENVOYÉ • ${email} • le client a payé et n'a rien reçu • token=${claimToken}`,
            );
          }
        } else {
          // Another concurrent webhook owns the short-lived send lock. Its
          // success/failure response controls Stripe's retry policy.
          const { data: deliveryState } = await supabase
            .from("wavacademy_subscriptions")
            .select("activation_email_status, activation_email_sent_at")
            .eq("id", subRow.id)
            .single();
          claimEmailSent = Boolean(deliveryState?.activation_email_sent_at) || deliveryState?.activation_email_status === "sent";
        }
      }

      if (!claimToken) {
        await safeNotifyError(
          "WavAcademy Webhook",
          `🚨 Aucun token de claim généré • ${email} • le client a payé sans recevoir d'accès`,
        );
        return jsonResponse({ error: "Wav Academy claim missing" }, 500);
      }

      if (claimEmailFailure) {
        // Ask Stripe to replay. The next invocation reuses subscription/claim,
        // skips successful side effects and retries only this failed email.
        return jsonResponse({ error: "Wav Academy activation email failed" }, 500);
      }

      if (subscriptionCreated || claimEmailSentThisAttempt || wavstatsProvisionedThisAttempt) {
        await safeNotifySuccess(
          "WavAcademy",
          `Nouveau membre • ${plan} • ${accessMonths ?? "?"} mois • ${email} • ${
            claimEmailSent ? "email d'activation envoyé" : "email pris en charge par un rejeu concurrent"
          } • WavStats ${
            wavstatsProvisioned
              ? activationUrl
                ? "provisionné"
                : "provisionné (compte existant)"
              : canProvision
                ? "⚠️ ÉCHEC, à créditer à la main"
                : "à créditer à la main (provisioning pas encore activé)"
          }`,
        );
      }

      return jsonResponse({
        received: true,
        product: "wavacademy",
        replay: !subscriptionCreated,
        activation_email: claimEmailSent ? "sent" : "in_progress",
      });
    }

    // ── customer.subscription.deleted (WavAcademy cancellation) ─────────────
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      // Find the matching wavacademy_subscriptions row by Stripe subscription id.
      // This works regardless of whether the original checkout went through the
      // legacy Edge Function (with metadata.type) or a Stripe Payment Link.
      const { data: subRow } = await supabase
        .from("wavacademy_subscriptions")
        .select("discord_user_id, discord_role_env")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();

      if (subRow) {
        console.log(`WavAcademy subscription cancelled: ${subscription.id}`);

        await supabase
          .from("wavacademy_subscriptions")
          .update({ status: "cancelled", discord_role_granted: false })
          .eq("stripe_subscription_id", subscription.id);

        if (subRow.discord_user_id && subRow.discord_role_env) {
          await assignDiscordRole(subRow.discord_user_id, subRow.discord_role_env, "revoke");
        }

        await safeNotifySuccess("WavAcademy", `Résiliation abonnement • ${subscription.id}`);
      }
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    await safeNotifyError("Stripe Webhook", getErrorMessage(error));
    // A processing failure must be visible to Stripe so the signed event is
    // retried. Product handlers above are idempotent across those replays.
    return jsonResponse({ received: false, processing_error: true }, 500);
  }
});
