/** Pure validation shared by webhook and launcher. Never infer product from price alone. */
export function checkoutMismatch(
  session: { mode: string | null; currency: string | null; amount_total: number | null },
  items: { quantity: number | null; price: { id: string } | null }[],
  expectedPrice: string | undefined,
  amount: number,
): string | null {
  if (session.mode !== "payment" || session.currency !== "eur" || session.amount_total !== amount) return "Montant, devise ou mode incorrect";
  if (!expectedPrice || items.length !== 1 || items[0].quantity !== 1 || items[0].price?.id !== expectedPrice) return "Prix Stripe non reconnu";
  return null;
}
