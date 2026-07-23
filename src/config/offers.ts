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
