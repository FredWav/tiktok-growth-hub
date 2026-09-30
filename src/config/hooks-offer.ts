/**
 * Offre « Bibliothèque de hooks TikTok » vendue sur /hooks-tiktok.
 *
 * Pur data (importé par seo.ts, donc par vite.config.ts au build) : aucun import React.
 * Chiffres fournis par Fred, à ne pas arrondir ni compléter. Les liens Stripe portent
 * metadata.produit = code, lue par stripe-webhook pour livrer les fichiers
 * (voir supabase/functions/_shared/hooks-delivery.ts).
 */

export const HOOKS_LIBRARY = {
  total: 850,
  analyzedVideos: "1,1 M",
  minViews: "100 000",
  minMultiple: "x5",
};

export type HooksPackOffer = {
  code: "hooks_100" | "hooks_250" | "hooks_500";
  name: string;
  hooks: number;
  price: number;
  pitch: string;
  medianViews: string;
  medianMultiple: string;
  badge?: string;
  featured?: boolean;
  stripeUrl: string;
};

/** Ordre d'affichage sur ordinateur : 100, 250, 500. Sur mobile : 250, 500, 100. */
export const HOOKS_PACKS_OFFER: HooksPackOffer[] = [
  {
    code: "hooks_100",
    name: "Pack 100",
    hooks: 100,
    price: 29,
    pitch: "100 hooks pour démarrer.",
    medianViews: "1,2 M",
    medianMultiple: "x37",
    stripeUrl: "https://buy.stripe.com/7sYcN460YbXr7v41DacMM0K",
  },
  {
    code: "hooks_250",
    name: "Pack 250",
    hooks: 250,
    price: 49,
    pitch: "250 hooks, le bon équilibre entre volume et performance.",
    medianViews: "1,6 M",
    medianMultiple: "x55",
    badge: "Recommandé",
    featured: true,
    stripeUrl: "https://buy.stripe.com/7sY5kCexugdH4iS5TqcMM0L",
  },
  {
    code: "hooks_500",
    name: "Pack 500",
    hooks: 500,
    price: 99,
    pitch: "Les hooks les plus performants de la bibliothèque.",
    medianViews: "1,6 M",
    medianMultiple: "x81",
    badge: "Les plus performants",
    stripeUrl: "https://buy.stripe.com/4gM28qfByd1vg1A1DacMM0M",
  },
];

export const HOOKS_BUNDLE = {
  code: "hooks_850" as const,
  hooks: 850,
  price: 149,
  stripeUrl: "https://buy.stripe.com/7sYaEWcpm3qV02C95CcMM0N",
};

export const HOOKS_PACKS_TOTAL_PRICE = HOOKS_PACKS_OFFER.reduce((sum, p) => sum + p.price, 0);

export const HOOKS_PACK_FEATURES = [
  "0 hook en commun avec les autres packs",
  "PDF + fichier tableur",
  "Structure réutilisable pour chaque hook",
  "Lien vers chaque vidéo d'origine",
];

/** Fiches réelles montrées en exemple. Les [CASES] de la structure sont surlignées. */
export const HOOKS_EXAMPLES = [
  { hook: "Une app « caméra » cachée !", structure: "[FONCTION] cachée !", views: "13,3 M" },
  {
    hook: "Arrête de demander aux gens de te chercher les billets d'avion.",
    structure: "Arrête de demander aux gens de [TÂCHE].",
    views: "1 M",
  },
  {
    hook: "À seulement 19 ans, il décide d'acquérir une chambre de bonne grâce à une astuce.",
    structure: "À seulement [ÂGE], il décide de [PROJET AMBITIEUX] grâce à une astuce.",
    views: "2,6 M",
  },
];

/** « 0,29 € » : prix par hook arrondi au centime. */
export function pricePerHook(price: number, hooks: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price / hooks);
}
