import type { CheckoutContext, CheckoutHandler } from "./context.ts";

/**
 * Aiguillage d'une session Checkout entre les modules produits.
 *
 * Chaque module reconnaît ses propres sessions et renvoie null sinon. Une panne
 * dans un module (lecture impossible, exception) n'empêche plus les suivants
 * d'examiner la session : si l'un d'eux la reconnaît, c'est sa réponse qui part.
 * Si personne ne la reconnaît après une panne, on répond 500 pour que Stripe
 * rejoue l'événement, plutôt que de classer à tort le paiement « à rapprocher ».
 */
export type NamedHandler = [name: string, handler: CheckoutHandler];

export type RouterDeps = {
  /** Enregistre un paiement qu'aucun module ne reconnaît. */
  logUnmatched: (ctx: CheckoutContext) => Promise<void>;
  notifyError: (title: string, message: string) => Promise<void>;
  json: (body: Record<string, unknown>, status?: number) => Response;
  errorMessage: (error: unknown) => string;
};

export async function routeCheckout(
  ctx: CheckoutContext,
  handlers: NamedHandler[],
  deps: RouterDeps,
): Promise<Response> {
  const failures: string[] = [];
  for (const [name, handler] of handlers) {
    try {
      const response = await handler(ctx);
      if (response) return response;
    } catch (err) {
      const message = `${name} : ${deps.errorMessage(err)}`;
      failures.push(message);
      console.error(`[stripe-webhook] module ${name} en échec • session=${ctx.session.id}`, message);
    }
  }

  if (failures.length) {
    await deps.notifyError(
      "Stripe Webhook",
      `Session ${ctx.session.id} non traitée, Stripe va rejouer • ${failures.join(" | ")}`,
    );
    return deps.json({ received: false, processing_error: true, failures }, 500);
  }

  if (ctx.session.payment_status === "paid") {
    await deps.logUnmatched(ctx);
    await deps.notifyError("Stripe Webhook", `Paiement à rapprocher : ${ctx.session.id}. Aucun nouvel accès ouvert.`);
  }
  console.log(`Checkout session ${ctx.session.id} : aucun produit reconnu`);
  return deps.json({ received: true });
}
