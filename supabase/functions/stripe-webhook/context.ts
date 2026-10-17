import type Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { notifyError, notifySuccess } from "../_shared/itpush.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    const parts = [e.code, e.message, e.details, e.hint]
      .filter((v): v is string | number => typeof v === "string" || typeof v === "number")
      .map(String);
    if (parts.length) return parts.join(" • ").slice(0, 500);
    try {
      return JSON.stringify(error).slice(0, 500);
    } catch {
      return "Erreur non sérialisable";
    }
  }
  return String(error);
}

export async function safeNotifyError(title: string, message: string): Promise<void> {
  try {
    await notifyError(title, message);
  } catch (notifyErr) {
    console.error(`Failed to send error notification for ${title}:`, notifyErr);
  }
}

export async function safeNotifySuccess(title: string, message: string): Promise<void> {
  try {
    await notifySuccess(title, message);
  } catch (notifyErr) {
    console.error(`Failed to send success notification for ${title}:`, notifyErr);
  }
}

/** Ce que chaque module produit reçoit pour traiter une session Checkout. */
export type CheckoutContext = {
  stripe: Stripe;
  // deno-lint-ignore no-explicit-any
  supabase: any;
  session: Stripe.Checkout.Session;
  event: Stripe.Event;
  supabaseUrl: string;
  serviceRoleKey: string;
};

/**
 * Un module renvoie une réponse s'il reconnaît la session comme la sienne,
 * ou null pour laisser le module suivant l'examiner.
 */
export type CheckoutHandler = (ctx: CheckoutContext) => Promise<Response | null>;
