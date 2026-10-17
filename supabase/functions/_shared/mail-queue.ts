import type { Database } from "./commerce.ts";

/**
 * File d'e-mails commerce et utilitaires purs. Aucun import réseau (esm.sh) :
 * ce module est chargé tel quel par les tests Node comme par les Edge Functions.
 */
export const site = () => Deno.env.get("SITE_URL") || "https://fredwav.com";

// Le socle commerce v3 n'est pas encore en base : consigner un paiement à rapprocher
// ne doit jamais faire échouer le webhook (Stripe retenterait en boucle).
export function missingCommerceTable(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  return code === "42P01" || code === "PGRST205";
}

export async function enqueue(
  client: Database,
  key: string,
  recipient: string,
  subject: string,
  body: string,
) {
  const { error } = await client.from("commerce_mail").upsert({
    dedupe_key: key,
    recipient,
    subject,
    body,
  }, { onConflict: "dedupe_key", ignoreDuplicates: true });
  // Le socle commerce v3 n'est pas encore en base : ne jamais faire échouer
  // l'appelant (webhook Stripe) parce que la file d'emails est absente.
  if (error && !missingCommerceTable(error)) throw error;
  if (error) {
    console.error("commerce_mail absente, email non mis en file:", key, subject);
  }
}
