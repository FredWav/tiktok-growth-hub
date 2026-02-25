/**
 * Stripe Price IDs configuration.
 * 
 * Auto-detects mode from STRIPE_SECRET_KEY prefix (sk_test_ vs sk_live_).
 * Can be overridden with STRIPE_MODE env var.
 */

type StripeMode = "test" | "live";

const PRICE_IDS = {
  test: {
    analyse_express: "price_1T4jiMPXtjut80rmEJgrHCDJ",
    one_shot: "price_1T4jihPXtjut80rmZqXzMdIn",
    vip_3_months: "price_1T4jiuPXtjut80rm1jK0K66w",
    vip_6_months: "price_1T4jjuPXtjut80rmI0bmLmLh",
    vip_12_months: "price_1T4jklPXtjut80rmykmo5hbD",
  },
  live: {
    analyse_express: "price_1T4pbIBfuzQl0PTiYbMnz92u",
    one_shot: "price_1T4pbcBfuzQl0PTity4YOdMv",
    vip_3_months: "price_1T4pbqBfuzQl0PTipRtbfEoW",
    vip_6_months: "price_1T4pc8BfuzQl0PTihU7VtQvo",
    vip_12_months: "price_1T4pdnBfuzQl0PTipiRe3X6a",
  },
} as const;

/** Returns prices matching the current Stripe key mode. Called at request time. */
export function getStripePrices() {
  const mode = getStripeMode();
  console.log(`[stripe-config] mode=${mode}`);
  return PRICE_IDS[mode];
}

export function getStripeMode(): StripeMode {
  const envMode = Deno.env.get("STRIPE_MODE");
  if (envMode === "test" || envMode === "live") return envMode;
  const key = Deno.env.get("STRIPE_SECRET_KEY") || "";
  if (key.startsWith("sk_test_")) return "test";
  return "live";
}

// Keep backwards-compat exports (lazy getters)
export const stripePrices = new Proxy({} as typeof PRICE_IDS["live"], {
  get(_target, prop: string) {
    return getStripePrices()[prop as keyof typeof PRICE_IDS["live"]];
  },
});
export const stripeMode = "live"; // deprecated, use getStripeMode()
