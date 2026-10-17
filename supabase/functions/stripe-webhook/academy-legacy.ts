import type Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { type CheckoutContext, getErrorMessage, jsonResponse, safeNotifyError, safeNotifySuccess } from "./context.ts";

/**
 * Ancien tunnel Wav Academy (Payment Links 3/6/12 mois et checkout historique).
 * Conservé tant que des abonnements historiques peuvent émettre des événements ;
 * la nouvelle gamme passe par commerceCheckout.
 */
export async function handleLegacyAcademyCheckout(ctx: CheckoutContext): Promise<Response | null> {
  const { supabase, session, event, supabaseUrl, serviceRoleKey } = ctx;
  const metadata = session.metadata;
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

  // Pas une vente Academy historique : le routeur décide (autre module ou paiement à rapprocher).
  if (!plan || !discordRoleEnv || !email) return null;

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

  console.log(`WavAcademy payment confirmed: plan=${plan}, months=${accessMonths ?? "n/a"}, recurring=${!!stripeSubscriptionId}, consent=${consentId ?? "n/a"}`);

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
            `WavStats provisioning OK (essai ${attempt}) • ref=${session.id} • HTTP ${res.status} • ${
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
          `WavStats provisioning échec (essai ${attempt}) • ref=${session.id} • ${wavstatsError}`,
        );
        if (!retryable || attempt === 3) break;
      } catch (err) {
        wavstatsError = err instanceof Error ? err.message : String(err);
        console.error(
          `WavStats provisioning erreur réseau (essai ${attempt}) • ref=${session.id} • ${wavstatsError}`,
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

/** Résiliation d'un abonnement Academy mensuel historique. */
// deno-lint-ignore no-explicit-any
export async function handleSubscriptionDeleted(supabase: any, event: Stripe.Event): Promise<void> {
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
      .update({ status: "active", access_expires_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscription.id);

    // Expiration worker preserves another active entitlement and retries Discord errors.

    await safeNotifySuccess("WavAcademy", `Résiliation abonnement • ${subscription.id}`);
  }
}
