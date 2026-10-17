/**
 * Dédoublonnage des événements Stripe (table stripe_events).
 *
 * - "new"       : premier passage, à traiter ;
 * - "retry"     : déjà reçu sans succès (échec ou coupure), à retraiter ;
 * - "duplicate" : déjà traité avec succès, on répond 200 sans rien refaire ;
 * - "untracked" : journal indisponible, on traite quand même (les modules sont idempotents).
 */
export type EventState = "new" | "retry" | "duplicate" | "untracked";

type StripeEventLike = { id: string; type: string; livemode: boolean };

// deno-lint-ignore no-explicit-any
type Client = any;

const missingTable = (code?: string) => code === "42P01" || code === "PGRST205";

export async function beginEvent(client: Client, event: StripeEventLike): Promise<EventState> {
  const { error } = await client.from("stripe_events")
    .insert({ id: event.id, type: event.type, livemode: event.livemode });
  if (!error) return "new";
  if (missingTable(error.code)) return "untracked";
  if (error.code !== "23505") throw error;

  const { data, error: readError } = await client.from("stripe_events")
    .select("processed_at, attempts").eq("id", event.id).single();
  if (readError) throw readError;
  if (data.processed_at) return "duplicate";
  await client.from("stripe_events")
    .update({ attempts: (data.attempts ?? 1) + 1 }).eq("id", event.id);
  return "retry";
}

export async function finishEvent(
  client: Client,
  id: string,
  ok: boolean,
  detail: Record<string, unknown>,
): Promise<void> {
  const patch = ok
    ? { processed_at: new Date().toISOString(), outcome: detail, last_error: null }
    : { outcome: detail, last_error: String(detail.error ?? "échec").slice(0, 1000) };
  const { error } = await client.from("stripe_events").update(patch).eq("id", id);
  // Le journal ne doit jamais changer la réponse faite à Stripe.
  if (error && !missingTable(error.code)) console.error(`stripe_events update failed: ${id}`, error);
}
