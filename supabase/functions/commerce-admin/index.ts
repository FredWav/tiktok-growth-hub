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
import { getStripeSecretKey } from "../_shared/stripe-config.ts";

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
      ]);
      if (results.some((r) => r.error)) throw new Error("Lecture indisponible");
      return json({
        orders: results[0].data,
        applications: results[1].data,
        unmatched: results[2].data,
        failed_mail: results[3].data,
      });
    }
    if (b.action === "create") {
      if (!["academy", "premium"].includes(b.offer)) {
        throw new Error("Offre invalide");
      }
      const start = text(b.start_date, 10, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error("Date invalide");
      const { data, error } = await client.from("commerce_orders").insert({
        offer: b.offer,
        first_name: text(b.first_name, 1, 100),
        email: email(b.email),
        start_date: start,
        start_time: b.offer === "premium" ? text(b.start_time, 5, 5) : "00:00",
        invoice_reference: typeof b.invoice_reference === "string"
          ? text(b.invoice_reference, 0, 200)
          : null,
        amount_cents: b.offer === "academy" ? 74900 : 199000,
        ...(b.application_id ? { application_id: uuid(b.application_id) } : {}),
      }).select("*").single();
      if (error) throw error;
      await client.from("commerce_audit").insert({
        order_id: data.id,
        actor,
        action: "created",
      });
      return json({ order: data, url: `${site()}/inscription/${data.token}` });
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
      const [{ data: o, error: oe }, { data: p, error: pe }, session, items] =
        await Promise.all([
          client.from("commerce_orders").select("*").eq("id", orderId).single(),
          client.from("commerce_unmatched_payments").select("*").eq(
            "session_id",
            sessionId,
          ).single(),
          stripe.checkout.sessions.retrieve(sessionId),
          stripe.checkout.sessions.listLineItems(sessionId, { limit: 2 }),
        ]);
      if (oe || pe || !o || !p) {
        throw new Error("Commande ou paiement à rapprocher introuvable");
      }
      const priceId = Deno.env.get(
        o.offer === "academy"
          ? "COMMERCE_ACADEMY_PRICE_ID"
          : "COMMERCE_PREMIUM_PRICE_ID",
      );
      if (
        !priceId || items.data.length !== 1 ||
        items.data[0].price?.id !== priceId || items.data[0].quantity !== 1 ||
        session.mode !== "payment" || session.payment_status !== "paid" ||
        session.currency !== "eur" || session.amount_total !== o.amount_cents ||
        (!session.livemode && Deno.env.get("ALLOW_TEST_FULFILLMENT") !== "true")
      ) throw new Error("Produit, montant, mode ou règlement incompatible");
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
      const { data, error } = await client.from("commerce_orders").update({
        start_date: text(b.start_date, 10, 10),
        ...(b.start_time ? { start_time: text(b.start_time, 5, 5) } : {}),
      }).eq("id", orderId).in("status", [
        "pending",
        "scheduled",
        "needs_reschedule",
      ]).or(`lock_until.is.null,lock_until.lt.${new Date().toISOString()}`)
        .select("id").single();
      if (error || !data) throw new Error("Replanification impossible");
      await client.from("commerce_audit").insert({
        order_id: orderId,
        actor,
        action: "rescheduled",
        details: { start_date: b.start_date, start_time: b.start_time },
      });
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
