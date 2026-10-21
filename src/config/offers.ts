/**
 * Source de vérité unique des offres et de leurs prix.
 *
 * Ce fichier est importé à la fois par les pages React ET par vite.config.ts
 * au moment du build (génération du sitemap, de llms.txt et des coquilles HTML).
 * Il doit donc rester du **pur data** : aucun import React, aucune API navigateur.
 *
 * Gamme 2026-10 : deux familles (analyses automatisées, accompagnements avec Fred).
 * Les prix sont TTC. Ne jamais valoriser les encaissements historiques avec cette grille.
 * Le montant réellement encaissé reste celui du prix Stripe : changer les deux ensemble.
 */

export type OfferId = "analyse_video" | "analyse_express" | "one_shot" | "academy" | "premium";
export type OfferFamily = "analyses" | "accompagnements";

export type Offer = {
  id: OfferId;
  family: OfferFamily;
  name: string;
  /** Le besoin traité, dans les mots du visiteur. */
  need: string;
  /** Une ou deux phrases de présentation. */
  summary: string;
  /** Page de vente détaillée. */
  href: string;
  /** Prix public TTC en euros. */
  price: number;
  /** Prix d'entrée d'une offre sur devis (« Dès … »). */
  priceFrom?: boolean;
  /** Ce que couvre le prix (durée, unité). */
  priceNote: string;
  /** Prix de lancement : date réelle de fin et prix appliqué ensuite (jamais barré). */
  launch?: { untilLabel: string; nextPrice: number };
  /** Démarrages possibles par mois (capacité réelle de Fred). */
  capacityPerMonth?: number;
  format: string;
  duration: string;
  delivery: string;
  platforms: string;
  includes: string[];
  excludes?: string[];
  /** Achat direct ou demande étudiée personnellement par Fred. */
  purchase: "direct" | "request";
  cta: { label: string; href: string };
  featured?: boolean;
};

/**
 * Paiement en plusieurs fois proposé par les organismes partenaires au moment du
 * paiement Stripe (One Shot, Wav Academy, Wav Premium). Fred est réglé en une fois ;
 * l'échéancier lie le client à l'organisme. Ne jamais annoncer ici une offre à
 * intérêts (6, 12 ou 24 fois) : ce serait de la publicité pour un crédit.
 * PayPal via Stripe : le client choisit sur PayPal sa source, dont le « payer plus tard » (4 fois),
 * selon son éligibilité (docs.stripe.com/payments/paypal, vérifié le 17/10/2026).
 */
export const INSTALLMENTS_LABEL = "en 3 fois sans frais avec Klarna, en 3 ou 4 fois avec Scalapay, ou en 4 fois avec PayPal";
export const INSTALLMENTS_NOTE = "sous réserve d'acceptation par l'organisme de paiement";

/** Fin des prix de lancement : la hausse s'applique réellement à cette date. */
export const LAUNCH_END_LABEL = "31/12/2026";

/** Créneaux des lives Academy : engagement contractuel. */
export const ACADEMY_LIVE_SLOT = "le mardi de 18 h à 19 h 30 et le jeudi de 14 h à 16 h";
export const ACADEMY_SUPPORT_DAYS = "du lundi au vendredi, réponse sous deux jours ouvrés";
export const ACADEMY_MODULES_COUNT = 6;
export const ACADEMY_GUIDES_COUNT = 19;

export const OFFERS: Record<OfferId, Offer> = {
  analyse_video: {
    id: "analyse_video",
    family: "analyses",
    name: "Analyse vidéo",
    need: "Je veux savoir pourquoi cette vidéo n'a pas marché.",
    summary: "L'analyse automatisée d'une vidéo TikTok précise : accroche, structure, rétention et appel à l'action, avec des recommandations concrètes pour la suivante.",
    href: "/analyse-video",
    price: 2.9,
    priceNote: "par vidéo",
    launch: { untilLabel: LAUNCH_END_LABEL, nextPrice: 4.9 },
    format: "Automatisé",
    duration: "Une vidéo",
    delivery: "Rapport par e-mail en quelques minutes, avec son PDF",
    platforms: "TikTok uniquement",
    includes: [
      "Analyse d'une vidéo TikTok publique à partir de son lien",
      "Accroche, structure, rétention et appel à l'action passés au crible",
      "Recommandations concrètes pour ta prochaine vidéo",
      "Rapport en ligne et PDF envoyés par e-mail",
    ],
    purchase: "direct",
    cta: { label: "Analyser ma vidéo", href: "/analyse-video" },
  },
  analyse_express: {
    id: "analyse_express",
    family: "analyses",
    name: "Analyse Express",
    need: "Je veux comprendre ce qui bloque sur mon compte.",
    summary: "Le diagnostic automatisé de ton compte TikTok : tes points forts, tes blocages et tes prochaines actions, à partir de tes vidéos publiques.",
    href: "/analyse-express",
    price: 19.9,
    priceNote: "par compte",
    format: "Automatisé",
    duration: "Un compte, jusqu'à 120 vidéos",
    delivery: "Rapport en ligne et PDF, en quelques minutes",
    platforms: "TikTok uniquement",
    includes: [
      "Analyse de ton compte TikTok et de jusqu'à 120 vidéos publiques récentes",
      "Points forts, blocages et prochaines actions priorisées",
      "Tableau de bord en ligne et rapport PDF complet",
    ],
    purchase: "direct",
    cta: { label: "Analyser mon compte", href: "/analyse-express" },
  },
  one_shot: {
    id: "one_shot",
    family: "accompagnements",
    name: "One Shot",
    need: "Je veux un regard expert sur mon compte, une bonne fois.",
    summary: "Fred audite ton compte, puis vous passez 1 h 30 ensemble pour fixer la ligne à suivre, corriger tous les problèmes et répondre à toutes tes questions.",
    href: "/one-shot",
    price: 399,
    priceNote: "audit + 1 h 30 de rendez-vous",
    capacityPerMonth: 10,
    format: "Individuel",
    duration: "Un rendez-vous de 1 h 30",
    delivery: "Résumé écrit de l'appel envoyé dans l'heure",
    platforms: "TikTok, Instagram et YouTube",
    includes: [
      "Audit complet de ton compte, préparé par Fred avant le rendez-vous",
      "1 h 30 de rendez-vous en visio pour fixer la ligne à suivre",
      "Tous les problèmes repérés corrigés, toutes tes questions traitées",
      "Résumé écrit de l'appel pour garder toutes les infos",
      "Ressources envoyées selon tes besoins (cours, guides)",
    ],
    purchase: "request",
    cta: { label: "Demander mon One Shot", href: "/candidature?offre=one_shot" },
  },
  academy: {
    id: "academy",
    family: "accompagnements",
    name: "Wav Academy",
    need: "Je veux progresser dans la durée, avec un cadre et un groupe.",
    summary: "L'accompagnement collectif à vie : suivi sur Discord, deux lives par semaine, tous les cours et une stratégie construite dans le temps, que tu ajustes avec tes résultats.",
    href: "/wavacademy",
    price: 749,
    priceNote: "paiement unique, accès à vie tant que l'Academy existe",
    launch: { untilLabel: LAUNCH_END_LABEL, nextPrice: 990 },
    capacityPerMonth: 5,
    format: "Collectif",
    duration: "À vie, tant que la Wav Academy existe",
    delivery: "Accès au Discord et aux cours dès ton entrée",
    platforms: "TikTok, Instagram et YouTube",
    includes: [
      "Accès à vie, en un seul paiement, tant que la Wav Academy existe",
      "Deux lives par semaine : mardi 18 h–19 h 30 et jeudi 14 h–16 h (Paris)",
      "Résumé de chaque live, replay des lives de cours",
      "Suivi sur Discord du lundi au vendredi, réponse sous deux jours ouvrés",
      "Tous les cours et toutes les ressources, mises à jour comprises",
      "Une stratégie personnalisée, puis l'analyse de tes résultats et l'amélioration continue",
    ],
    excludes: ["Pas d'accompagnement individuel (c'est le Wav Premium)", "Aucun crédit WavStats inclus"],
    purchase: "direct",
    cta: { label: "Rejoindre la Wav Academy", href: "/wavacademy/inscription" },
    featured: true,
  },
  premium: {
    id: "premium",
    family: "accompagnements",
    name: "Wav Premium",
    need: "Je veux travailler en direct avec Fred, au plus près.",
    summary: "L'accompagnement individuel : rendez-vous réguliers, suivi WhatsApp et retours sur tes contenus au jour le jour, pendant au moins six semaines.",
    href: "/wav-premium",
    price: 1499,
    priceFrom: true,
    priceNote: "pour 6 semaines · 12 ou 18 semaines sur devis",
    capacityPerMonth: 2,
    format: "Individuel",
    duration: "6 semaines minimum (12 ou 18 sur devis)",
    delivery: "Démarrage à la date convenue ensemble",
    platforms: "TikTok, Instagram et YouTube",
    includes: [
      "Accompagnement individuel avec Fred, six semaines minimum",
      "Au moins trois rendez-vous : 1 h 30 pour démarrer, puis 1 h tous les quinze jours",
      "Suivi WhatsApp du lundi au vendredi, réponse sous un jour ouvré",
      "Une stratégie construite et ajustée avec toi",
      "Analyse de tes contenus au jour le jour, à la demande",
    ],
    excludes: ["Wav Academy et WavStats non inclus"],
    purchase: "request",
    cta: { label: "Demander mon accompagnement", href: "/candidature?offre=premium" },
  },
};

export const ANALYSES: Offer[] = [OFFERS.analyse_video, OFFERS.analyse_express];
export const ACCOMPAGNEMENTS: Offer[] = [OFFERS.one_shot, OFFERS.academy, OFFERS.premium];

/** 2.9 → « 2,90 € », 749 → « 749 € », 1499 → « 1 499 € ». */
export function formatEuros(amount: number): string {
  const cents = Math.round(amount * 100);
  const euros = Math.floor(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return cents % 100 === 0 ? `${euros} €` : `${euros},${String(cents % 100).padStart(2, "0")} €`;
}

/** Prix affiché : « 749 € » ou « Dès 1 499 € ». */
export function priceLabel(offer: Offer): string {
  return `${offer.priceFrom ? "Dès " : ""}${formatEuros(offer.price)}`;
}

/** Mention de lancement, sans prix barré : « Prix de lancement jusqu'au 31/12/2026, puis 990 € ». */
export function launchLabel(offer: Offer): string | null {
  if (!offer.launch) return null;
  return `Prix de lancement jusqu'au ${offer.launch.untilLabel}, puis ${formatEuros(offer.launch.nextPrice)}`;
}

/** Capacité : « 5 places par mois ». */
export function capacityLabel(offer: Offer): string | null {
  return offer.capacityPerMonth ? `${offer.capacityPerMonth} places par mois` : null;
}

/**
 * Nombre de créateurs accompagnés : preuve sociale affichée sur plusieurs pages.
 * Centralisé ici pour qu'il ne puisse plus diverger d'une page à l'autre.
 */
export const CREATORS_COUNT = "350+";

/**
 * Preuve sociale Analyse Express : 224 personnes au 17/10/2026, 21 h (UTC),
 * chiffre donné par Fred. Le total affiché sur /analyse-express = cette base +
 * les paiements valides après cette date (fonction express_paid_since, même
 * date de départ). Changer la base et la date ensemble.
 */
export const EXPRESS_USERS_BASE_COUNT = 224;

/**
 * Preuve sociale Analyse vidéo : 47 au 17/10/2026, 21 h (UTC), chiffre donné par
 * Fred. Total affiché = cette base + les paiements réels après cette date
 * (fonction video_paid_since). Changer la base et la date ensemble.
 */
export const VIDEO_USERS_BASE_COUNT = 47;

// ── Raccourcis historiques, calculés depuis le catalogue ────────────────────
export const EXPRESS_PRICE = OFFERS.analyse_express.price;
export const EXPRESS_PRICE_LABEL = formatEuros(EXPRESS_PRICE);
export const VIDEO_ANALYSIS_PRICE = OFFERS.analyse_video.price;
export const VIDEO_ANALYSIS_PRICE_LABEL = formatEuros(VIDEO_ANALYSIS_PRICE);
export const ACADEMY_FROM = OFFERS.academy.price;
export const PREMIUM_PRICE_LABEL = priceLabel(OFFERS.premium);

// ── Budget déclaré → offre recommandée (anciens formulaires) ───────────────
// Vocabulaire partagé avec les candidatures historiques et l'admin : ne jamais
// renommer un code sans migrer les leads déjà enregistrés en base.

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

/** Paliers historiques du Wav Premium (investissement total), pour l'admin. */
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

/** Tranches du formulaire d'orientation commercial. */
export const ORIENTATION_BUDGET_TIERS = [
  { value: "no_budget", label: "Je n'ai pas de budget pour me faire accompagner", short: "Pas de budget" },
  { value: "under_399", label: "1 - 398 €", short: "1 - 398 €" },
  { value: "399_748", label: "399 - 998 €", short: "399 - 998 €" },
  { value: "749_1989", label: "998 - 1 499 €", short: "998 - 1 499 €" },
  { value: "1990_plus", label: "Plus de 1 499 €", short: "Plus de 1 499 €" },
] as const;

export const ORIENTATION_BUDGET_LABELS: Record<string, string> = Object.fromEntries(
  ORIENTATION_BUDGET_TIERS.map((tier) => [tier.value, tier.short]),
);
// Tranche disparue, encore présente sur des candidatures historiques.
ORIENTATION_BUDGET_LABELS["under_100"] = "0 - 100 €";

export type RecommendedOffer = "express" | "academy" | "premium";

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

/** Offre recommandée à partir d'un budget déclaré (anciens formulaires et admin). */
export function recommendedOfferForBudget(budget: string | null | undefined): RecommendedOffer {
  if (budget && budget in OFFER_BY_BUDGET) return OFFER_BY_BUDGET[budget as BudgetTier];
  if (budget && budget in LEGACY_OFFER_BY_BUDGET) return LEGACY_OFFER_BY_BUDGET[budget];
  // Valeur vraiment inconnue : entrée de gamme plutôt que survente.
  return "express";
}
