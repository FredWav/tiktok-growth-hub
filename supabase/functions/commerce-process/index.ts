import {
  cronCaller,
  db,
  deliverMail,
  enqueue,
  headers,
  json,
  OWNER_EMAIL,
  site,
} from "../_shared/commerce.ts";
import { OFFER_LABELS } from "../_shared/commerce-checkout.ts";

// Rôle Discord des membres Academy (variable d'environnement lue par wavacademy-claim-callback).
const ACADEMY_ROLE_ENV = "DISCORD_VIP2_ROLE_ID";

/**
 * Tâche planifiée (toutes les 5 minutes) : ouvre les accès à la date convenue,
 * clôt les accompagnements arrivés à terme, traite les remboursements, puis
 * envoie la file d'e-mails. La Wav Academy 2026-10 n'a pas de fin : une fois
 * l'accès ouvert, la commande sort de la boucle (automation_done).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (!cronCaller(req)) return json({ error: "Accès refusé" }, 403);
  const client = db(), now = new Date().toISOString();
  const summary = { activated: 0, closed: 0, released: 0, errors: 0 };
  const deadline = Date.now() + 25000;
  try {
    // Achats directs abandonnés : la réservation est échue depuis plus d'un jour.
    const { data: released, error: releaseError } = await client.from("commerce_orders")
      .update({ status: "expired", automation_done: true })
      .eq("source", "direct").eq("status", "pending").eq("amount_received", 0)
      .lt("hold_until", new Date(Date.now() - 86400000).toISOString())
      .select("id");
    if (releaseError) throw releaseError;
    summary.released = released?.length ?? 0;

    const { data: orders, error } = await client.from("commerce_orders")
      .select("*").in("status", ["scheduled", "active", "cancelled"])
      .eq("automation_done", false).order("last_processed_at").limit(50);
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
      const offer = OFFER_LABELS[o.offer] ?? o.offer;
      try {
        if (o.status === "cancelled" || (o.ends_at && o.ends_at <= now)) {
          if (o.subscription_id) {
            const { error: e } = await client.from("wavacademy_subscriptions")
              .update({
                access_expires_at: o.status === "cancelled" ? now : o.ends_at,
              }).eq("id", o.subscription_id);
            if (e) throw e;
          }
          const { error: e } = await client.from("commerce_orders").update({
            status: o.status === "cancelled" ? "cancelled" : "expired",
            automation_done: true,
          }).eq("id", o.id);
          if (e) throw e;
          summary.closed++;
          continue;
        }
        if (o.status === "active") {
          // Accès à vie déjà ouvert : plus rien à faire.
          if (!o.ends_at) {
            await client.from("commerce_orders").update({ automation_done: true }).eq("id", o.id);
          }
          continue;
        }
        if (
          !o.consent_at || o.amount_received !== o.amount_cents ||
          o.starts_at > now
        ) continue;
        if (o.offer !== "academy") {
          await enqueue(
            client,
            `start:${o.id}`,
            OWNER_EMAIL,
            `${offer} : démarrage`,
            `Commande ${o.id} · ${o.first_name} · ${o.email}\nRendez-vous le ${o.start_date} à ${String(o.start_time).slice(0, 5)} (Paris)${o.duration_weeks ? `, accompagnement de ${o.duration_weeks} semaines` : ""}.`,
          );
          const { error: e } = await client.from("commerce_orders").update({ status: "active" }).eq("id", o.id);
          if (e) throw e;
          summary.activated++;
          continue;
        }
        let subscriptionId = o.subscription_id;
        if (!subscriptionId) {
          const { error: e } = await client.from("wavacademy_subscriptions")
            .upsert({
              commerce_order_id: o.id,
              email: o.email,
              plan_type: "live",
              discord_role_env: ACADEMY_ROLE_ENV,
              access_months: null,
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
        const { error: subError } = await client.from(
          "wavacademy_subscriptions",
        ).update({ status: "active" }).eq("id", subscriptionId);
        if (subError) throw subError;
        // Jeton stable par commande, tiré au hasard à la création : une reprise ne crée jamais une seconde invitation.
        const { error: claimError } = await client.from("wavacademy_claims")
          .upsert({
            token: o.claim_token,
            subscription_id: subscriptionId,
            email: o.email,
            plan_type: "live",
            discord_role_env: ACADEMY_ROLE_ENV,
            expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          }, { onConflict: "token", ignoreDuplicates: true });
        if (claimError) throw claimError;
        await enqueue(
          client,
          `activation:${o.id}`,
          o.email,
          "Bienvenue dans la Wav Academy : ton accès Discord",
          `Bonjour ${o.first_name},\n\nTon accès à la Wav Academy est ouvert${o.ends_at ? ` jusqu'au ${new Date(o.ends_at).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}` : ", à vie, tant que la Wav Academy existe"}.\n\n1. Rejoins le Discord avec ce lien personnel (valable 7 jours) :\n${site()}/claim/${o.claim_token}\n\n2. Présente-toi dans le salon d'accueil : ton compte, ton objectif, ce qui te bloque. C'est le point de départ de ta stratégie.\n\nLives : mardi 18 h–19 h 30 et jeudi 14 h–16 h (heure de Paris).\nSuivi sur Discord du lundi au vendredi, réponse sous deux jours ouvrés.\n\nÀ très vite,\nFred Wav`,
        );
        await enqueue(
          client,
          `activation-owner:${o.id}`,
          OWNER_EMAIL,
          `Wav Academy : nouvel accès ouvert · ${o.first_name}`,
          `${o.first_name} · ${o.email}\nCommande ${o.id}. Lien Discord envoyé (valable 7 jours).`,
        );
        const { error: e } = await client.from("commerce_orders").update({
          status: "active",
          discord_status: "awaiting_claim",
          last_error: null,
          automation_done: !o.ends_at,
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
          OWNER_EMAIL,
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
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
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
