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
    save: null, note: "Pour poser des bases solides et trouver ton Format Signature.",
  },
  {
    term: "6m", months: 6, total: 499, monthly: 83, label: "Accélération", duration: "6 mois",
    save: "≈ 1 mois offert", note: "Le temps d'ancrer la méthode et de tenir le rythme.",
    badge: "Populaire",
  },
  {
    term: "12m", months: 12, total: 899, monthly: 75, label: "Maîtrise", duration: "12 mois",
    save: "≈ 3 mois offerts", note: "Un an complet pour installer un système d'acquisition durable.",
    highlight: true, badge: "Meilleure offre",
  },
];

/** Prix d'entrée de l'Academy, utilisé partout où on écrit « dès X € ». */
export const ACADEMY_FROM = Math.min(...ACADEMY_PLANS.map((p) => p.total));

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

/** Ce que les trois Pass ont en commun. */
export const ACADEMY_FEATURES = [
  "Contenu stratégique quotidien (Tapis Roulant)",
  "15 contenus en rotation permanente",
  "Live hebdomadaire avec Fred",
  "Discord premium (canaux avancés)",
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

export type RecommendedOffer = "express" | "academy" | "premium";

/**
 * Table de routage budget → offre. Typée `Record<BudgetTier, …>` : ajouter ou
 * renommer une tranche dans BUDGET_TIERS casse la compilation tant que cette
 * table n'est pas mise à jour. C'est le garde-fou qui survit à `strict: false`
 * dans tsconfig (contrairement à un switch, où un cas manquant passe en silence).
 *
 * ⚠️ La tranche 15-100 € pointe vers l'Academy parce que le paiement en 4× sans
 * frais met le pass Fondation à 74,75 €/mois — donc dans la tranche. Ce choix
 * dépend de l'unité de la question « Quel est ton budget ? », qui n'est
 * aujourd'hui précisée nulle part (au total ? par mois ?). À trancher avec Fred.
 */
const OFFER_BY_BUDGET: Record<BudgetTier, RecommendedOffer> = {
  no_budget: "express",
  "15_a_100": "academy",
  "100_a_300": "academy",
  "300_a_900": "academy",
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
  price: string;
  href: string;
  cta: string;
  featured?: boolean;
};

export const OFFER_TIERS: OfferTier[] = [
  {
    need: "Je veux comprendre ce qui bloque",
    name: "Analyse Express",
    price: EXPRESS_PRICE_LABEL,
    href: "/analyse-express",
    cta: "Lancer mon Analyse Express",
  },
  {
    need: "Je veux apprendre avec un cadre et une communauté",
    name: "Wav Academy",
    price: `dès ${ACADEMY_FROM} €`,
    href: "/wavacademy",
    cta: "Rejoindre la Wav Academy",
    featured: true,
  },
  {
    need: `Je veux un suivi individuel intensif de ${PREMIUM_DURATION_DAYS} jours`,
    name: "Wav Premium",
    price: "sur candidature",
    href: "/reserverunappel",
    cta: "Voir si le Wav Premium me correspond",
  },
];
