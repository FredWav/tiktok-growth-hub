/**
 * Source de vérité unique des offres et de leurs prix.
 *
 * Ce fichier est importé à la fois par les pages React ET par vite.config.ts
 * au moment du build (génération du sitemap, de llms.txt et des coquilles HTML).
 * Il doit donc rester du **pur data** : aucun import React, aucune API navigateur.
 *
 * Grille figée jusqu'au 31/12/2026. Aucun autre prix ne doit apparaître sur le site.
 */

export type AcademyPlan = {
  /** Identifiant de formule envoyé à record-wavacademy-consent */
  term: "3m" | "6m" | "12m";
  months: number;
  /** Prix total en euros, payé en une seule fois */
  total: number;
  /** Repère « au mois » — sert uniquement à montrer la dégressivité, ce n'est pas un prélèvement */
  monthly: number;
  label: string;
  duration: string;
  save: string | null;
  note: string;
  highlight?: boolean;
  badge?: string;
};

export const ACADEMY_PLANS: AcademyPlan[] = [
  {
    term: "3m", months: 3, total: 299, monthly: 100, label: "Fondation", duration: "3 mois",
    save: null, note: "Pour poser des bases solides et trouver ton format.",
  },
  {
    term: "6m", months: 6, total: 499, monthly: 83, label: "Accélération", duration: "6 mois",
    save: "≈ 1 mois offert", note: "Le temps d'ancrer la méthode et de tenir le rythme.",
    highlight: true, badge: "Recommandé",
  },
  {
    term: "12m", months: 12, total: 899, monthly: 75, label: "Maîtrise", duration: "12 mois",
    save: "≈ 3 mois offerts", note: "Un an complet pour installer un système de création durable.",
  },
];

/**
 * Formule d'entrée de l'Academy (la moins chère). Toute mention « dès X € »
 * doit être accompagnée de sa durée : un prix nu ne veut rien dire quand
 * l'offre est un accès à durée déterminée.
 */
export const ACADEMY_ENTRY = ACADEMY_PLANS.reduce((a, b) => (b.total < a.total ? b : a));

/** Prix d'entrée de l'Academy. À toujours afficher avec ACADEMY_ENTRY.duration. */
export const ACADEMY_FROM = ACADEMY_ENTRY.total;

/**
 * Nombre de créateurs accompagnés — preuve sociale affichée sur plusieurs pages
 * (home, /a-propos, /preuves, /wavacademy). Centralisé ici pour qu'il ne puisse
 * plus diverger d'une page à l'autre (le site affichait 300+ et 250+ selon les pages,
 * ce qui contredisait le positionnement « chiffres non gonflés »).
 */
export const CREATORS_COUNT = "350+";

/** Analyse Express — seul autre prix affiché publiquement. */
export const EXPRESS_PRICE = 11.9;
export const EXPRESS_PRICE_LABEL = "11,90 €";

/**
 * Wav Premium — pas de prix public (décision produit).
 * L'accès passe par une candidature qualifiée sur /reserverunappel.
 */
export const PREMIUM_DURATION_DAYS = 30;

/** Créneau du live hebdomadaire — engagement contractuel, il ne saute pas. */
export const ACADEMY_LIVE_SLOT = "le jeudi de 14h à 16h";
export const ACADEMY_SUPPORT_DAYS = "5 jours sur 7";
export const ACADEMY_MODULES_COUNT = 6;
export const ACADEMY_GUIDES_COUNT = 19;

/** Ce que les trois Pass ont en commun. */
export const ACADEMY_FEATURES = [
  `Live hebdomadaire ${ACADEMY_LIVE_SLOT}`,
  `Suivi ${ACADEMY_SUPPORT_DAYS}, tes questions vérifiées chaque jour`,
  "Feedback sur n'importe lequel de tes contenus, sur demande",
  "Discord premium (canaux avancés) et accès direct",
  `${ACADEMY_MODULES_COUNT} modules de formation et ${ACADEMY_GUIDES_COUNT} guides téléchargeables`,
];

// ── Budget déclaré → offre recommandée ──────────────────────────────────────
// Ces cinq codes sont le vocabulaire PARTAGÉ de toute l'app : formulaire de
// candidature, tunnel diagnostic et panneaux admin. Ne jamais en renommer un
// sans migrer les leads déjà enregistrés en base.

export const BUDGET_TIERS = [
  { value: "no_budget", label: "Je n'ai pas de budget pour me faire accompagner", short: "Pas de budget" },
  { value: "15_a_100", label: "Entre 15 € et 100 €", short: "Entre 15 € et 100 €" },
  { value: "100_a_300", label: "De 100 € à 300 €", short: "De 100 € à 300 €" },
  { value: "300_a_900", label: "De 300 € à 900 €", short: "De 300 € à 900 €" },
  { value: "900_plus", label: "900 € et +", short: "900 € et +" },
] as const;

export type BudgetTier = (typeof BUDGET_TIERS)[number]["value"];

/** Libellés des tranches courantes, pour l'admin. */
export const BUDGET_LABELS: Record<string, string> = Object.fromEntries(
  BUDGET_TIERS.map((t) => [t.value, t.short]),
);

/**
 * Paliers dédiés au Wav Premium. Les codes sont distincts des budgets mensuels
 * du diagnostic TikTok : ici la question porte bien sur l'investissement total
 * pour les 30 jours, et la réponse sert uniquement à qualifier la demande.
 */
export const PREMIUM_BUDGET_TIERS = [
  { value: "total_no_budget", label: "Je n'ai pas de budget pour me faire accompagner", short: "Pas de budget total" },
  { value: "total_15_a_100", label: "100 € maximum", short: "100 € maximum au total" },
  { value: "total_100_a_300", label: "Plus de 100 € et jusqu'à 300 €", short: "Plus de 100 € à 300 € au total" },
  { value: "total_300_a_900", label: "De 300 € à 900 €", short: "300 € à 900 € au total" },
  { value: "total_900_plus", label: "900 € et +", short: "900 € et + au total" },
] as const;

export const PREMIUM_BUDGET_LABELS: Record<string, string> = Object.fromEntries(
  PREMIUM_BUDGET_TIERS.map((t) => [t.value, t.short]),
);

export type RecommendedOffer = "express" | "academy" | "premium";

/**
 * Table de routage budget → offre. Typée `Record<BudgetTier, …>` : ajouter ou
 * renommer une tranche dans BUDGET_TIERS casse la compilation tant que cette
 * table n'est pas mise à jour. C'est le garde-fou qui survit à `strict: false`
 * dans tsconfig (contrairement à un switch, où un cas manquant passe en silence).
 *
 * Le budget déclaré est un montant MENSUEL (les questions le précisent).
 *  - jusqu'à 100 €/mois → Academy : le pass Fondation revient à ~75-100 €/mois
 *    (4× sans frais, ou 299 € en paiement unique)
 *  - 100-300 €/mois → Academy, éventuellement complétée par des sessions à tarif membre
 *  - au-delà de 300 €/mois → l'accompagnement individuel Wav Premium devient pertinent
 */
const OFFER_BY_BUDGET: Record<BudgetTier, RecommendedOffer> = {
  no_budget: "express",
  "15_a_100": "academy",
  "100_a_300": "academy",
  "300_a_900": "premium",
  "900_plus": "premium",
};

/** Tranches disparues, encore présentes sur des candidatures historiques. */
const LEGACY_OFFER_BY_BUDGET: Record<string, RecommendedOffer> = {
  "10_a_100": "express",
  "1000_plus": "premium",
};

/**
 * Offre recommandée à partir du budget déclaré. **Source unique** — le formulaire
 * de candidature et le tunnel diagnostic l'appellent tous les deux, sinon un même
 * prospect reçoit deux réponses différentes selon sa porte d'entrée (c'est
 * exactement le bug qui existait avant centralisation).
 */
export function recommendedOfferForBudget(budget: string | null | undefined): RecommendedOffer {
  if (budget && budget in OFFER_BY_BUDGET) return OFFER_BY_BUDGET[budget as BudgetTier];
  if (budget && budget in LEGACY_OFFER_BY_BUDGET) return LEGACY_OFFER_BY_BUDGET[budget];
  // Valeur vraiment inconnue : entrée de gamme plutôt que survente.
  return "express";
}

/** Comparateur des 3 niveaux — consommé par OfferComparison.tsx. */
export type OfferTier = {
  need: string;
  name: string;
  price?: string;
  description: string;
  note?: string;
  href: string;
  cta: string;
  featured?: boolean;
};

export const OFFER_TIERS: OfferTier[] = [
  {
    need: "Je veux comprendre ce qui bloque maintenant.",
    name: "Analyse Express",
    price: EXPRESS_PRICE_LABEL,
    description: "Un diagnostic automatisé de ton compte TikTok pour identifier rapidement tes principaux points forts, tes blocages et tes prochaines actions.",
    note: "Disponible sur TikTok uniquement pour le moment.",
    href: "/analyse-express",
    cta: "Analyser mon compte",
  },
  {
    need: "Je veux progresser dans un cadre régulier.",
    name: "Wav Academy",
    price: "3, 6 ou 12 mois",
    description: "Des ressources, des outils, des lives et une communauté pour apprendre à analyser tes contenus et prendre de meilleures décisions semaine après semaine.",
    href: "/wavacademy",
    cta: "Rejoindre la Wav Academy",
    featured: true,
  },
  {
    need: "Je veux travailler directement avec Fred.",
    name: "Wav Premium",
    description: `${PREMIUM_DURATION_DAYS} jours d'accompagnement individuel pour travailler directement sur ta stratégie, tes contenus et tes objectifs réseaux sociaux.`,
    href: "/reserverunappel",
    cta: "Réserve ton appel",
  },
];
