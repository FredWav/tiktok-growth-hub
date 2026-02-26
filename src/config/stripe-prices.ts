/**
 * Stripe Price IDs configuration (frontend).
 * 
 * Reads VITE_STRIPE_MODE env var ("test" | "live"), defaults to "live".
 * The STRIPE_SECRET_KEY secret must match the mode (sk_test_ or sk_live_).
 */

type StripeMode = "test" | "live";

// Reads from VITE_STRIPE_MODE env var, defaults to "live"
const STRIPE_MODE: StripeMode = (import.meta.env.VITE_STRIPE_MODE as StripeMode) || "test";

const PRICE_IDS = {
  test: {
    vip_3_months: "price_1T4jiuPXtjut80rm1jK0K66w",
    vip_6_months: "price_1T4jjuPXtjut80rmI0bmLmLh",
    vip_12_months: "price_1T4jklPXtjut80rmykmo5hbD",
  },
  live: {
    vip_3_months: "price_1T4pbqBfuzQl0PTipRtbfEoW",
    vip_6_months: "price_1T4pc8BfuzQl0PTihU7VtQvo",
    vip_12_months: "price_1T4pdnBfuzQl0PTipiRe3X6a",
  },
} as const;

export const stripePrices = PRICE_IDS[STRIPE_MODE];
export const stripeMode = STRIPE_MODE;
