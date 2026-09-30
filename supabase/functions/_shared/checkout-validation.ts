/** Pure validation shared by webhook and launcher. Never infer product from price alone. */
export function checkoutMismatch(
  session: { mode: string | null; currency: string | null; amount_total: number | null; amount_subtotal?: number | null },
  items: { quantity: number | null; price: { id: string } | null }[],
  expectedPrice: string | undefined,
  amount: number,
): string | null {
  // Le tarif catalogue (sous-total) doit correspondre. Le total encaissé peut être
  // inférieur quand un code promo Stripe a été appliqué : ce n'est pas une anomalie.
  const subtotal = session.amount_subtotal ?? session.amount_total;
  const total = session.amount_total ?? 0;
  if (session.mode !== "payment" || session.currency !== "eur" || subtotal !== amount || total <= 0 || total > amount) {
    return "Montant, devise ou mode incorrect";
  }
  if (!expectedPrice || items.length !== 1 || items[0].quantity !== 1 || items[0].price?.id !== expectedPrice) return "Prix Stripe non reconnu";
  return null;
}
