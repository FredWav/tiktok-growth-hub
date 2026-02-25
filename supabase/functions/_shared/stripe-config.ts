/**
 * Stripe Price IDs configuration.
 * 
 * Switch between test and production by changing STRIPE_MODE.
 * The STRIPE_SECRET_KEY secret must match the mode (sk_test_ or sk_live_).
 */

type StripeMode = "test" | "live";

// Detect mode: env var first, then auto-detect from STRIPE_SECRET_KEY prefix
function detectStripeMode(): StripeMode {
  const envMode = Deno.env.get("STRIPE_MODE");
  if (envMode === "test" || envMode === "live") return envMode;
  // Auto-detect from the secret key
  const key = Deno.env.get("STRIPE_SECRET_KEY") || "";
  if (key.startsWith("sk_test_")) return "test";
  return "live";
}

const STRIPE_MODE: StripeMode = detectStripeMode();

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

export const stripePrices = PRICE_IDS[STRIPE_MODE];
export const stripeMode = STRIPE_MODE;
