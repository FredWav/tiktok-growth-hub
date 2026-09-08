import {
  db,
  deliverMail,
  enqueue,
  headers,
  json,
  service,
  site,
} from "../_shared/commerce.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (!service(req)) return json({ error: "Accès refusé" }, 403);
  const client = db(), now = new Date().toISOString();
  const summary = { activated: 0, errors: 0 };
  const deadline = Date.now() + 25000;
  try {
    const { data: orders, error } = await client.from("commerce_orders").select(
      "*",
    )
      .in("status", ["pending", "scheduled", "active", "cancelled"]).order(
        "last_processed_at",
      ).limit(50);
    if (error) throw error;
    for (const o of orders || []) {
      if (Date.now() > deadline) break;
      const { data: owned, error: lockError } = await client.from(
        "commerce_orders",
      ).update({ lock_until: new Date(Date.now() + 120000).toISOString() })
        .eq("id", o.id).eq("start_date", o.start_date).eq(
          "amount_received",
          o.amount_received,
        ).eq("status", o.status).or(`lock_until.is.null,lock_until.lt.${now}`)
        .select("id").maybeSingle();
      if (lockError || !owned) continue;
      try {
        if (o.status === "cancelled" || o.ends_at <= now) {
          if (o.subscription_id) {
            const { error: e } = await client.from("wavacademy_subscriptions")
              .update({
                access_expires_at: o.status === "cancelled" ? now : o.ends_at,
              }).eq("id", o.subscription_id);
            if (e) throw e;
          }
          if (o.status === "cancelled" && o.wavstats_status === "active") {
            await enqueue(
              client,
              `revoke:${o.id}`,
              "contact@fredwav.com",
              "Révocation WavStats à effectuer",
              `Commande ${o.id} remboursée. Révoquer l'avantage partenaire dans WavStats, en conservant les autres droits du client.`,
            );
          }
          await client.from("commerce_orders").update({
            status: o.status === "cancelled" ? "cancelled" : "expired",
            wavstats_status: o.status === "cancelled"
              ? "revocation_required"
              : "expired",
          }).eq("id", o.id);
          continue;
        }
        if (
          o.status === "active" || !o.consent_at ||
          o.amount_received !== o.amount_cents || o.starts_at > now
        ) continue;
        if (o.offer === "premium") {
          await enqueue(
            client,
            `start:${o.id}`,
            "contact@fredwav.com",
            "Wav Premium : démarrage",
            `Commande ${o.id} · ${o.email}\nDate ${o.start_date}. Rendez-vous et suivi à assurer selon les modalités convenues.`,
          );
          await client.from("commerce_orders").update({ status: "active" }).eq(
            "id",
            o.id,
          );
          continue;
        }
        // Launch gate: enable only after verifying the partner's monthly reset contract.
        if (Deno.env.get("COMMERCE_WAVSTATS_VERIFIED") !== "true") {
          throw new Error("Validation WavStats requise avant activation");
        }
        let subscriptionId = o.subscription_id;
        if (!subscriptionId) {
          const { error: e } = await client.from("wavacademy_subscriptions")
            .upsert({
              commerce_order_id: o.id,
              email: o.email,
              plan_type: "live",
              discord_role_env: "DISCORD_VIP2_ROLE_ID",
              access_months: 6,
              access_starts_at: o.starts_at,
              access_expires_at: o.ends_at,
              status: "scheduled",
              discord_role_granted: false,
            }, { onConflict: "commerce_order_id", ignoreDuplicates: true });
          if (e) throw e;
          const result = await client.from("wavacademy_subscriptions").select(
            "id",
          ).eq("commerce_order_id", o.id).single();
          if (result.error) throw result.error;
          subscriptionId = result.data.id;
          await client.from("commerce_orders").update({
            subscription_id: subscriptionId,
          }).eq("id", o.id);
        }
        let activationUrl = o.wavstats_activation_url;
        if (o.wavstats_status !== "active") {
          const key = Deno.env.get("WAVSTATS_PARTNER_KEY"),
            plan = Deno.env.get("WAVSTATS_PARTNER_PLAN_ID");
          if (!key || !plan) {
            throw new Error("Configuration partenaire manquante");
          }
          const response = await fetch(
            "https://wavstats.com/api/v1/partners/subscriptions",
            {
              method: "POST",
              headers: { "X-API-Key": key, "Content-Type": "application/json" },
              body: JSON.stringify({
                externalRef: o.id,
                email: o.email,
                planId: plan,
                expiresAt: o.ends_at,
              }),
              signal: AbortSignal.timeout(20000),
            },
          );
          if (!response.ok) throw new Error(`WavStats HTTP ${response.status}`);
          const data = await response.json();
          activationUrl = data.activationUrl || null;
          const { error: e } = await client.from("commerce_orders").update({
            wavstats_status: "active",
            wavstats_activation_url: activationUrl,
          }).eq("id", o.id);
          if (e) throw e;
        }
        const { error: subError } = await client.from(
          "wavacademy_subscriptions",
        ).update({ status: "active" }).eq("id", subscriptionId);
        if (subError) throw subError;
        // Stable token per order, random at creation. Retry never creates a second invitation.
        const { error: claimError } = await client.from("wavacademy_claims")
          .upsert({
            token: o.claim_token,
            subscription_id: subscriptionId,
            email: o.email,
            plan_type: "live",
            discord_role_env: "DISCORD_VIP2_ROLE_ID",
            expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          }, { onConflict: "token", ignoreDuplicates: true });
        if (claimError) throw claimError;
        await enqueue(
          client,
          `activation:${o.id}`,
          o.email,
          "Ton accès Wav Academy commence",
          `Bonjour ${o.first_name},\nTon accès commence le ${o.start_date} et se termine le ${
            new Date(o.ends_at).toLocaleDateString("fr-FR", {
              timeZone: "Europe/Paris",
            })
          }.\nDiscord : ${site()}/claim/${o.claim_token} (lien valable 7 jours)\nWavStats : ${
            activationUrl ||
            "https://wavstats.com — connecte-toi avec ton email habituel"
          }\n3 000 crédits par mois, non cumulables, renouvelés à date anniversaire.\nLives mardi 18h–19h30 et jeudi 14h–16h (Paris), accès libre ; résumé sans replay.\nDiscord : réponse sous deux jours ouvrés, du lundi au vendredi.`,
        );
        const { error: e } = await client.from("commerce_orders").update({
          status: "active",
          discord_status: "awaiting_claim",
          last_error: null,
        }).eq("id", o.id);
        if (e) throw e;
        summary.activated++;
      } catch (error) {
        summary.errors++;
        await client.from("commerce_orders").update({
          last_error: String(error).slice(0, 500),
        }).eq("id", o.id);
        await enqueue(
          client,
          `activation-error:${o.id}`,
          "contact@fredwav.com",
          "Activation à vérifier",
          `Commande ${o.id}\n${String(error)}`,
        );
      } finally {
        await client.from("commerce_orders").update({
          lock_until: null,
          last_processed_at: new Date().toISOString(),
        }).eq("id", o.id);
      }
    }
    const revoke = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/revoke-expired-wavacademy`,
      {
        method: "POST",
        headers: {
          Authorization: req.headers.get("Authorization")!,
          "Content-Type": "application/json",
        },
        body: "{}",
        signal: AbortSignal.timeout(20000),
      },
    );
    await deliverMail(client);
    if (!revoke.ok) throw new Error("Révocation à retenter");
    return json(summary);
  } catch (error) {
    console.error(error);
    return json({ error: String(error) }, 500);
  }
});
