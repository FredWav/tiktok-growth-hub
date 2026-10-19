import {
  admin,
  db,
  email,
  enqueue,
  headers,
  json,
  site,
  text,
  uuid,
} from "../_shared/commerce.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { getStripeMode, getStripeSecretKey } from "../_shared/stripe-config.ts";
import { salesEnabled } from "../_shared/commerce-checkout.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  const client = db();
  let actor: string;
  try {
    actor = await admin(req, client);
  } catch {
    return json({ error: "Accès refusé" }, 403);
  }
  try {
    const b = await req.json();
    if (b.action === "revenue") {
      const { data, error } = await client.rpc("commerce_revenue");
      if (error) throw error;
      return json(data);
    }
    if (b.action === "overview") {
      const { data, error } = await client.rpc("admin_overview");
      if (error) throw error;
      return json(data);
    }
    if (b.action === "status") {
      // État réellement vérifié : présence des réglages (jamais leur valeur, sauf
      // les réglages publics comme le mode Stripe ou l'adresse du site).
      const has = (name: string) => !!Deno.env.get(name);
      const live = getStripeMode() === "live";
      const suffix = live ? "LIVE" : "TEST";
      const [cron, lastEvent, failedEvents, lastMail, failedMail] = await Promise.all([
        client.rpc("admin_cron_status"),
        client.from("stripe_events").select("received_at,type").order("received_at", { ascending: false }).limit(1).maybeSingle(),
        client.from("stripe_events").select("id", { count: "exact", head: true }).is("processed_at", null)
          .lt("received_at", new Date(Date.now() - 3600000).toISOString()),
        client.from("commerce_mail").select("sent_at").eq("state", "sent").order("sent_at", { ascending: false }).limit(1).maybeSingle(),
        client.from("commerce_mail").select("id", { count: "exact", head: true }).eq("state", "failed"),
      ]);
      const check = (label: string, ok: boolean, detail?: string | null) => ({ label, ok, detail: detail ?? null });
      type CronJob = { name: string; schedule: string; active: boolean; last_status: string | null; last_start: string | null };
      return json({
        groups: [
          { title: "Paiements Stripe", checks: [
            check("Mode", true, live ? "Réel (live)" : "Test"),
            check("Clé Stripe", has(live ? "STRIPE_SECRET_KEY" : "STRIPE_SECRET_KEY_TEST") || has("STRIPE_SECRET_KEY")),
            check("Secret du webhook", has(live ? "STRIPE_WEBHOOK_SECRET" : "STRIPE_WEBHOOK_SECRET_TEST")),
            check("Lien et prix Analyse Express", has(`STRIPE_EXPRESS_PAYMENT_LINK_${suffix}`) && has(`STRIPE_EXPRESS_PRICE_ID_${suffix}`)),
            check("Lien et produit Analyse vidéo", has(`STRIPE_VIDEO_PAYMENT_LINK_${suffix}`) && has(`STRIPE_VIDEO_PRODUCT_ID_${suffix}`)),
            check("Ventes d'accompagnements ouvertes", salesEnabled()),
            check("Dernier événement Stripe reçu", !!lastEvent.data,
              lastEvent.data ? `${lastEvent.data.type}, ${lastEvent.data.received_at}` : "aucun"),
            check("Événements Stripe en échec depuis plus d'une heure", (failedEvents.count ?? 0) === 0, String(failedEvents.count ?? 0)),
          ] },
          { title: "E-mails", checks: [
            check("Mot de passe SMTP (noreply@fredwav.com)", has("SMTP_PASSWORD")),
            check("Dernier e-mail envoyé", !!lastMail.data, lastMail.data?.sent_at ?? "aucun"),
            check("E-mails en échec", (failedMail.count ?? 0) === 0, String(failedMail.count ?? 0)),
          ] },
          { title: "Analyses", checks: [check("Clé API WavStats", has("WAVSTATS_API_KEY"))] },
          { title: "Wav Academy (Discord)", checks: [
            check("Bot Discord", has("DISCORD_BOT_TOKEN") && has("DISCORD_GUILD_ID")),
            check("Connexion Discord (OAuth)", has("DISCORD_CLIENT_ID") && has("DISCORD_CLIENT_SECRET") && has("DISCORD_OAUTH_REDIRECT_URI")),
            check("Rôle des membres", has("DISCORD_VIP2_ROLE_ID")),
          ] },
          { title: "Tâches planifiées", checks: [
            check("Secret des tâches planifiées", has("RECONCILE_CRON_SECRET")),
            ...((cron.data ?? []) as CronJob[]).map((j) =>
              check(`${j.name} (${j.schedule})`, j.active && j.last_status === "succeeded",
                j.last_start ? `${j.last_status}, ${j.last_start}` : "jamais exécutée")),
          ] },
          { title: "Site", checks: [
            check("Adresse du site", has("SITE_URL"), Deno.env.get("SITE_URL") ?? "https://fredwav.com (par défaut)"),
            check("Clé d'empreinte des consentements", has("CONSENT_FINGERPRINT_KEY")),
          ] },
        ],
      });
    }
    if (b.action === "list") {
      const results = await Promise.all([
        client.from("commerce_orders").select("*").order("created_at", {
          ascending: false,
        }).limit(200),
        client.from("commerce_applications").select("*").order("created_at", {
          ascending: false,
        }).limit(200),
        client.from("commerce_unmatched_payments").select("*").is(
          "resolved_order_id",
          null,
        ).order("created_at", { ascending: false }).limit(100),
        client.from("commerce_mail").select("id,recipient,subject,state,error")
          .eq("state", "failed").limit(100),
        client.rpc("commerce_places"),
      ]);
      if (results.some((r) => r.error)) throw new Error("Lecture indisponible");
      return json({
        orders: results[0].data,
        applications: results[1].data,
        unmatched: results[2].data,
        failed_mail: results[3].data,
        places: results[4].data,
      });
    }
    if (b.action === "create") {
      if (!["one_shot", "academy", "premium"].includes(b.offer)) {
        throw new Error("Offre invalide");
      }
      const start = text(b.start_date, 10, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error("Date invalide");
      const amount = b.amount_eur === undefined || b.amount_eur === "" || b.amount_eur === null
        ? null
        : Math.round(Number(b.amount_eur) * 100);
      if (amount !== null && (!Number.isSafeInteger(amount) || amount <= 0)) {
        throw new Error("Montant invalide");
      }
      const holdDays = Number(b.hold_days ?? 3);
      if (!Number.isInteger(holdDays) || holdDays < 1 || holdDays > 30) {
        throw new Error("Échéance de réservation invalide (1 à 30 jours)");
      }
      const { data, error } = await client.rpc("commerce_create_order", {
        v: {
          offer: b.offer,
          first_name: text(b.first_name, 1, 100),
          email: email(b.email),
          start_date: start,
          start_time: b.offer === "academy" ? "00:00" : text(b.start_time, 5, 5),
          amount_cents: amount,
          duration_weeks: b.offer === "premium" && b.duration_weeks ? Number(b.duration_weeks) : null,
          invoice_reference: typeof b.invoice_reference === "string" && b.invoice_reference.trim()
            ? text(b.invoice_reference, 1, 200)
            : null,
          application_id: b.application_id ? uuid(b.application_id) : null,
          hold_until: new Date(Date.now() + holdDays * 86400000).toISOString(),
          actor,
        },
      });
      if (error) throw new Error(error.message);
      return json({ order: data, url: `${site()}/inscription/${data.token}` });
    }
    if (b.action === "capacity") {
      if (!["one_shot", "academy", "premium"].includes(b.offer)) throw new Error("Offre invalide");
      const month = text(b.month, 7, 10).slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("Mois invalide");
      const capacity = Number(b.capacity);
      if (!Number.isInteger(capacity) || capacity < 0 || capacity > 100) throw new Error("Capacité invalide");
      const { error } = await client.from("commerce_capacity").upsert({
        offer: b.offer, month: `${month}-01`, capacity, updated_at: new Date().toISOString(),
      }, { onConflict: "offer,month" });
      if (error) throw error;
      await client.from("commerce_audit").insert({ actor, action: "capacity", details: { offer: b.offer, month, capacity } });
      return json({ ok: true, message: "Capacité du mois enregistrée." });
    }
    if (b.action === "grant_lifetime") {
      const { data, error } = await client.rpc("commerce_grant_lifetime", {
        p_email: email(b.email),
        p_actor: actor,
      });
      if (error) throw new Error(error.message);
      return json({ ok: true, message: `Accès Wav Academy passé à vie (${data} accès).` });
    }
    if (b.action === "stage") {
      if (!["received", "booked", "closed", "declined"].includes(b.stage)) {
        throw new Error("Étape invalide");
      }
      const { error } = await client.from("commerce_applications").update({
        stage: b.stage,
      }).eq("id", uuid(b.id));
      if (error) throw error;
      return json({ ok: true });
    }
    if (b.action === "retry_mail") {
      const { error } = await client.from("commerce_mail").update({
        state: "pending",
        error: null,
        attempts: 0,
      }).eq("id", uuid(b.id)).eq("state", "failed");
      if (error) throw error;
      return json({ ok: true });
    }
    const orderId = uuid(b.id);
    if (b.action === "reconcile") {
      const sessionId = text(b.session_id, 8, 200);
      const stripe = new Stripe(getStripeSecretKey(), {
        apiVersion: "2025-08-27.basil",
      });
      const [{ data: o, error: oe }, { data: p, error: pe }, session] =
        await Promise.all([
          client.from("commerce_orders").select("*").eq("id", orderId).single(),
          client.from("commerce_unmatched_payments").select("*").eq(
            "session_id",
            sessionId,
          ).single(),
          stripe.checkout.sessions.retrieve(sessionId),
        ]);
      if (oe || pe || !o || !p) {
        throw new Error("Commande ou paiement à rapprocher introuvable");
      }
      if (
        session.mode !== "payment" || session.payment_status !== "paid" ||
        session.currency !== "eur" ||
        session.amount_total !== o.amount_cents - o.amount_received ||
        (!session.livemode && Deno.env.get("ALLOW_TEST_FULFILLMENT") !== "true")
      ) throw new Error("Montant, mode ou règlement incompatible");
      if (!p.received_at) {
        throw new Error(
          "Date d’encaissement non vérifiable : rapprochement manuel requis",
        );
      }
      const { error } = await client.rpc("commerce_record_payment", {
        p_order: orderId,
        p_method: "stripe",
        p_reference: session.id,
        p_amount: session.amount_total,
        p_received: p.received_at,
        p_actor: actor,
      });
      if (error) throw error;
      const { error: resolvedError } = await client.from(
        "commerce_unmatched_payments",
      ).update({ resolved_order_id: orderId }).eq("session_id", sessionId);
      if (resolvedError) throw resolvedError;
      return json({
        ok: true,
        message:
          "Paiement rapproché. Dates et consentements restent nécessaires pour l’activation.",
      });
    }
    if (b.action === "express_refund") {
      const reference = text(b.reference, 3, 200),
        refundedAt = new Date(text(b.received_at)).toISOString();
      if (new Date(refundedAt).getTime() > Date.now()) {
        throw new Error("Date future interdite");
      }
      const { data: row, error } = await client.from("express_analyses").update(
        {
          refund_reference: reference,
          refunded_at: refundedAt,
          status: "refunded",
        },
      ).eq("id", orderId).is("refund_reference", null).select("id")
        .maybeSingle();
      if (error || !row) {
        throw new Error("Analyse introuvable ou remboursement déjà tracé");
      }
      await client.from("commerce_audit").insert({
        actor,
        action: "express_refund",
        details: { analysis_id: orderId, reference, refunded_at: refundedAt },
      });
      return json({ ok: true });
    }
    if (b.action === "payment" || b.action === "refund") {
      const amount = Number(b.amount_cents);
      if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error("Montant invalide");
      }
      const { error } = await client.rpc("commerce_record_payment", {
        p_order: orderId,
        p_method: b.action === "refund" ? "refund" : "transfer",
        p_reference: text(b.reference, 3, 200),
        p_amount: b.action === "refund" ? -amount : amount,
        p_received: new Date(text(b.received_at)).toISOString(),
        p_actor: actor,
      });
      if (error) throw error;
      const { data: o, error: oe } = await client.from("commerce_orders")
        .select("*").eq("id", orderId).single();
      if (oe) throw oe;
      await enqueue(
        client,
        `receipt:${orderId}:${b.reference}`,
        o.email,
        "Mise à jour de ton règlement",
        `Commande ${o.id}\n${
          b.action === "refund" ? "Remboursement effectué" : "Virement reçu"
        } : ${(amount / 100).toFixed(2)} €\nDate prévue : ${o.start_date}\n${
          o.status === "needs_reschedule"
            ? "Fred doit convenir avec toi d’une nouvelle date."
            : "Les accès sont soumis à la date convenue et à la validation de l’inscription."
        }`,
      );
      return json({ ok: true });
    }
    if (b.action === "reschedule") {
      const start = text(b.start_date, 10, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error("Date invalide");
      const { error } = await client.rpc("commerce_reschedule", {
        p_order: orderId,
        p_start: start,
        p_time: b.start_time ? text(b.start_time, 5, 5) : null,
        p_actor: actor,
      });
      if (error) throw new Error(error.hint === "capacity_full" ? "Mois complet pour cette offre : augmenter la capacité du mois ou choisir une autre date." : "Replanification impossible");
      return json({
        ok: true,
        message: "Le client doit confirmer la nouvelle date depuis son lien.",
      });
    }
    throw new Error("Action inconnue");
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : "Opération impossible",
    }, 400);
  }
});
