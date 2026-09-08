import {
  CGV_TEXT,
  db,
  EARLY_TEXT,
  headers,
  json,
  uuid,
  VERSION,
} from "../_shared/commerce.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  try {
    const b = await req.json(), client = db();
    const { data: o, error } = await client.from("commerce_orders").select("*")
      .eq("token", uuid(b.token)).maybeSingle();
    if (error || !o || ["cancelled", "expired"].includes(o.status)) {
      return json({ error: "Inscription indisponible. Contacte Fred." }, 404);
    }
    if (b.action === "accept") {
      if (b.expected_starts_at !== o.starts_at) throw new Error("La date ou l’heure a changé. Actualise la page avant d’accepter.");
      if (o.status === "needs_reschedule") {
        throw new Error("La date doit être reconvenue avec Fred.");
      }
      if (b.consent_cgv !== true) {
        throw new Error("Accepte les CGV pour confirmer.");
      }
      if (
        new Date(o.starts_at).getTime() < Date.now() + 14 * 86400000 &&
        b.early_start !== true
      ) {
        throw new Error(
          "Demande un démarrage anticipé ou conviens avec Fred d'une date après 14 jours.",
        );
      }
      const { error: acceptError } = await client.rpc("commerce_accept", {
        p_token: o.token,
        p_start: o.start_date,
        p_early: b.early_start === true,
        p_consent: {
          version: VERSION,
          cgv: CGV_TEXT,
          early: b.early_start === true ? EARLY_TEXT : null,
          start_date: o.start_date,
          starts_at: o.starts_at,
        },
      });
      if (acceptError) {
        throw new Error(
          "Modalités non confirmées. Actualise la page ou contacte Fred pour replanifier.",
        );
      }
    }
    const { data: current } = await client.from("commerce_orders").select(
      "consent_at",
    ).eq("id", o.id).single();
    const paymentLink = o.offer === "academy"
      ? (Deno.env.get("COMMERCE_ACADEMY_PAYMENT_URL") ||
        "https://buy.stripe.com/6oUeVc7525z38z84PmcMM0I")
      : Deno.env.get("COMMERCE_PREMIUM_PAYMENT_URL");
    const configured = Deno.env.get(
      o.offer === "academy"
        ? "COMMERCE_ACADEMY_PAYMENT_LINK_ID"
        : "COMMERCE_PREMIUM_PAYMENT_LINK_ID",
    );
    const canPay = Deno.env.get("COMMERCE_SALES_ENABLED") === "true" &&
      !!current?.consent_at && o.amount_received === 0 &&
      o.status !== "needs_reschedule" &&
      (o.offer !== "academy" ||
        Deno.env.get("COMMERCE_WAVSTATS_VERIFIED") === "true");
    return json({
      offer: o.offer,
      first_name: o.first_name,
      amount_cents: o.amount_cents,
      amount_received: o.amount_received,
      start_date: o.start_date,
      start_time: o.start_time,
      starts_at: o.starts_at,
      sales_enabled: Deno.env.get("COMMERCE_SALES_ENABLED") === "true" && (o.offer !== "academy" || Deno.env.get("COMMERCE_WAVSTATS_VERIFIED") === "true"),
      status: o.status,
      accepted: !!current?.consent_at,
      cgv_text: CGV_TEXT,
      early_text: EARLY_TEXT,
      payment_url: canPay && paymentLink && configured
        ? `${paymentLink}?client_reference_id=${o.id}`
        : null,
      transfer_instructions: canPay
        ? (Deno.env.get("COMMERCE_TRANSFER_INSTRUCTIONS") ||
          "Fred te transmet le RIB et la facture directement. Indique la référence de commande avec ton virement.")
        : null,
      reference: o.id,
    });
  } catch (error) {
    return json({
      error: error instanceof Error
        ? error.message
        : "Inscription indisponible",
    }, 400);
  }
});
