/**
 * Source de vérité unique des métadonnées par route.
 *
 * Utilisé à deux endroits :
 *  1. au runtime, par <SEOHead /> dans chaque page ;
 *  2. au build SSG, par l'entrée serveur et scripts/prerender.mjs, qui écrivent
 *     le rendu React complet avec title / description / canonical / OG /
 *     JSON-LD, puis génèrent sitemap.xml + llms.txt + ssg-manifest.json.
 *
 * Les deux lisent le même manifeste afin de garder le HTML, les routes et les
 * fichiers techniques alignés.
 *
 * Pur data : aucun import React, aucune API navigateur (importé par vite.config.ts).
 */

import {
  ACADEMY_PLANS,
  ACADEMY_GUIDES_COUNT,
  ACADEMY_LIVE_SLOT,
  ACADEMY_MODULES_COUNT,
  ACADEMY_SUPPORT_DAYS,
  EXPRESS_PRICE,
  PREMIUM_DURATION_DAYS,
} from "./offers";
import { HOOKS_FAQ } from "./hooks-faq";
import { HOOK_CATEGORIES, HOOKS_PUBLISHED_COUNT, HOOKS_TOTAL_COUNT } from "../data/hooks";


export const BASE_URL = "https://fredwav.com";
export const OG_IMAGE = `${BASE_URL}/og-image.png`;

export type RouteSeo = {
  path: string;
  title: string;
  description: string;
  ogType?: "website" | "article";
  canonical?: string | false;
  noindex?: boolean;
  /**
   * Contenu servi dans le <noscript> de la coquille prerendue.
   * `sections` (facultatif) : des couples titre + résumé, pour donner de la
   * matière aux crawlers qui n'exécutent pas JavaScript (robots des IA) sur les
   * pages éditoriales, là où un titre et un paragraphe ne suffisent pas.
   */
  noscript?: {
    h1: string;
    body: string;
    sections?: { h2: string; body: string }[];
    links?: { href: string; label: string }[];
  };
  schema?: Record<string, unknown> | Record<string, unknown>[];
  /** Priorité sitemap. `false` = hors sitemap (mais la route reste prerendue). */
  sitemap?: number | false;
  /** Résumé une ligne pour llms.txt. `false` = exclue du fichier. */
  llms?: string | false;
  llmsSection?: "principales" | "offres" | "ressources" | "legales";
};

export type RouteKind = "content" | "commercial" | "legal" | "functional" | "private" | "redirect";
export type RouteRenderMode = "ssg" | "csr" | "redirect";
export type ClientBoundary = "none" | "auth" | "admin";

type ManifestBase = {
  path: string;
  kind: RouteKind;
  render: RouteRenderMode;
  indexable: boolean;
  private: boolean;
  noindex: boolean;
  title: string;
  description: string;
  canonical: string | false;
  sitemap: number | false;
  schema?: Record<string, unknown>;
  redirectTo?: string;
  status: 200 | 307 | 308;
};

export type SsgRouteManifestEntry = RouteSeo &
  ManifestBase & {
    render: "ssg";
    private: false;
    status: 200;
    canonical: string;
  };

export type CsrRouteManifestEntry = ManifestBase & {
  render: "csr";
  kind: "functional" | "private";
  clientBoundary: ClientBoundary;
  indexable: false;
  noindex: true;
  canonical: false;
  sitemap: false;
  status: 200;
};

export type RedirectRouteManifestEntry = ManifestBase & {
  render: "redirect";
  kind: "redirect";
  private: false;
  indexable: false;
  noindex: true;
  canonical: false;
  sitemap: false;
  redirectTo: string;
  status: 307 | 308;
};

export type RouteManifestEntry =
  | SsgRouteManifestEntry
  | CsrRouteManifestEntry
  | RedirectRouteManifestEntry;

const academyPricing = ACADEMY_PLANS.map((p) => `${p.duration} (${p.total} €)`).join(", ");

/**
 * FAQ éditoriale de la home, partagée avec l'accordéon visible.
 */
export const HOME_FAQ = [
  {
    question: "Est-ce que Fred travaille uniquement sur TikTok ?",
    answer: "Non. TikTok est une grosse partie de mon expertise et de mon contenu, mais les accompagnements portent sur ta stratégie réseaux dans son ensemble. Instagram, YouTube ou Facebook peuvent parfaitement faire partie du travail si c'est pertinent pour ton activité. L'Analyse Express, en revanche, reste actuellement limitée à TikTok.",
  },
  {
    question: "Quelle différence entre la Wav Academy et le Wav Premium ?",
    answer: `Ce ne sont pas deux niveaux du même accompagnement. La Wav Academy est un cadre collectif avec des ressources, des outils, des lives et une communauté. Le Wav Premium est un accompagnement individuel de ${PREMIUM_DURATION_DAYS} jours où on travaille directement sur ta situation et ta stratégie.`,
  },
  {
    question: "La Wav Academy est-elle un abonnement ?",
    answer: "Non. Tu choisis 3, 6 ou 12 mois et tu paies la période choisie. Il n'y a pas de reconduction automatique.",
  },
  {
    question: "Je débute. Est-ce trop tôt ?",
    answer: "Pas forcément. Un cadre peut t'éviter d'empiler des contenus sans comprendre ce que tu testes. Mais il faut être prêt à créer, à regarder les retours et à appliquer : aucun accompagnement ne peut faire cette partie à ta place.",
  },
  {
    question: "Est-ce que tu peux garantir mes résultats ?",
    answer: "Non. Et méfie-toi de quelqu'un qui te dit l'inverse. Je peux analyser, corriger, structurer et t'aider à prendre de meilleures décisions. Je ne contrôle ni ton niveau d'exécution, ni ton audience, ni les plateformes.",
  },
];

/** Fil visible des trois guides : Accueil › Ressources › guide. */
function breadcrumbSchema(path: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Ressources", item: `${BASE_URL}/ressources` },
      { "@type": "ListItem", position: 3, name, item: `${BASE_URL}${path}` },
    ],
  };
}

const ROUTES: RouteSeo[] = [
  {
    path: "/",
    title: "Fred Wav — stratégie réseaux sociaux et contenus",
    description:
      "Comprends ce que racontent tes contenus et prends de meilleures décisions sur TikTok, Instagram, YouTube et Facebook avec Fred Wav.",
    noscript: {
      h1: "Arrête de poster seul. Tes stats disent déjà ce qui bloque.",
      body: "Pas de hack ni de promesse de viralité. Fred Wav part de tes contenus, de tes statistiques, de ton positionnement et de tes objectifs pour travailler ta stratégie sur TikTok, Instagram, YouTube et Facebook. Trois besoins : l'Analyse Express TikTok, la Wav Academy et le Wav Premium multiréseaux.",
      links: [
        { href: "/wavacademy", label: "Wav Academy — dès 299 €" },
        { href: "/analyse-express", label: "Analyse Express — 11,90 €" },
        { href: "/reserverunappel", label: "Wav Premium — sur candidature" },
        { href: "/preuves", label: "Témoignages et résultats" },
        { href: "/a-propos", label: "À propos de Fred Wav" },
        { href: "/newsletter", label: "Guide gratuit des hooks" },
        { href: "/contact", label: "Contact" },
      ],
    },
    // Pas de fil d'Ariane sur l'accueil : c'est la racine. Le précédent
    // annonçait Accueil > Academy > Témoignages, un chemin de navigation
    // qui n'existe nulle part sur le site.
    sitemap: 1.0,
    llms: "Stratégie de contenu et réseaux sociaux avec Fred Wav : Wav Academy comme offre principale, Analyse Express automatisée uniquement pour TikTok, et Wav Premium individuel sur TikTok, Instagram, YouTube ou Facebook.",
    llmsSection: "principales",
  },
  {
    path: "/wavacademy",
    title: "Accompagnement TikTok pour créateurs — Wav Academy | Fred Wav",
    description: `Accompagnement TikTok pour créateurs : live, feedback, ${ACADEMY_MODULES_COUNT} modules et ${ACADEMY_GUIDES_COUNT} guides. Pass ${ACADEMY_PLANS.map((p) => p.duration).join(", ")} en paiement unique.`,

    noscript: {
      h1: "Wav Academy : l’accompagnement TikTok pour créateurs qui ne veulent plus poster seuls",
      body: `Un accompagnement régulier : un live hebdomadaire ${ACADEMY_LIVE_SLOT}, un suivi ${ACADEMY_SUPPORT_DAYS}, du feedback sur tes contenus à la demande, un Discord premium, ${ACADEMY_MODULES_COUNT} modules de formation et ${ACADEMY_GUIDES_COUNT} guides téléchargeables. Trois Pass prépayés : ${academyPricing}. Paiement unique, sans abonnement ni reconduction.`,
      links: [{ href: "/wavacademy", label: "Voir les formules Wav Academy" }],
    },
    schema: {
        "@context": "https://schema.org",
        "@type": "Course",
        name: "Wav Academy",
        description: `Accompagnement TikTok pour créateurs de contenu : live hebdomadaire, suivi ${ACADEMY_SUPPORT_DAYS}, feedback sur les contenus à la demande, ${ACADEMY_MODULES_COUNT} modules de formation, ${ACADEMY_GUIDES_COUNT} guides téléchargeables et outil d'analyse WavStats inclus.`,
        provider: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
        url: `${BASE_URL}/wavacademy`,
        inLanguage: "fr-FR",
        offers: ACADEMY_PLANS.map((p) => ({
          name: `Pass ${p.label} — ${p.duration}`,
          price: String(p.total),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${BASE_URL}/wavacademy`,
        })),
    },

    sitemap: 0.9,
    llms: `Accompagnement régulier pour créateurs (live hebdomadaire, suivi ${ACADEMY_SUPPORT_DAYS}, feedback à la demande, Discord premium, ${ACADEMY_MODULES_COUNT} modules, ${ACADEMY_GUIDES_COUNT} guides et outil d'analyse WavStats). Trois Pass prépayés, paiement unique sans abonnement : ${academyPricing}.`,
    llmsSection: "offres",
  },
  {
    path: "/analyse-express",
    title: "Analyse Express — audit TikTok | Fred Wav",
    description: `Audit TikTok automatisé : health score, métriques, persona et plan d'action. Rapport PDF à ${EXPRESS_PRICE.toFixed(2).replace(".", ",")} €.`,

    noscript: {
      h1: "Analyse Express — l'audit TikTok automatisé de ton compte",
      body: "Audit de ton profil, analyse de tes 30 dernières vidéos, stratégie hashtags et plan d'action personnalisé. Résultats en moins de 2 minutes, rapport PDF complet pour 11,90 €.",
      links: [{ href: "/analyse-express", label: "Lancer mon Analyse Express" }],
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Analyse Express",
      description:
        "Diagnostic complet de ton compte avec health score, métriques clés, analyse de persona et rapport PDF téléchargeable.",
      offers: {
        price: EXPRESS_PRICE.toFixed(2),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${BASE_URL}/analyse-express`,
      },
    },
    sitemap: 0.8,
    llms: "Audit TikTok automatisé (score de santé, meilleures heures, hashtags, régularité) avec rapport PDF, à 11,90 €.",
    llmsSection: "offres",
  },
  {
    path: "/reserverunappel",
    title: "Wav Premium — accompagnement réseaux sociaux | Fred Wav",
    description:
      `Wav Premium : ${PREMIUM_DURATION_DAYS} jours d'accompagnement individuel avec Fred Wav sur TikTok, Instagram, YouTube, Facebook ou une stratégie multiréseaux.`,

    noscript: {
      h1: `Wav Premium — ${PREMIUM_DURATION_DAYS} jours d'accompagnement individuel`,
      body: "Présente ta situation, tes réseaux, tes objectifs, ton blocage et le résultat que tu attends. L'accompagnement peut porter sur TikTok, Instagram, YouTube, Facebook ou une stratégie qui combine plusieurs plateformes. Fred lit chaque demande avant de proposer un appel.",
      links: [{ href: "/reserverunappel", label: "Envoyer ma demande Wav Premium" }],
    },
    sitemap: 0.8,
    llms: `Wav Premium : formulaire de qualification pour ${PREMIUM_DURATION_DAYS} jours d'accompagnement individuel avec Fred Wav sur TikTok, Instagram, YouTube, Facebook ou une stratégie multiréseaux.`,
    llmsSection: "offres",
  },
  {
    path: "/preuves",
    title: "Témoignages et résultats clients | Fred Wav",
    description:
      "Découvre des résultats clients contextualisés, des témoignages vidéo et des retours directs après accompagnement avec Fred Wav.",
    noscript: {
      h1: "Des résultats, pas des promesses",
      body: "Ce qui s'est réellement passé chez des créateurs accompagnés : résultats contextualisés, témoignages vidéo et captures de retours. Aucun résultat n'est présenté comme une garantie.",
      links: [{ href: "/preuves", label: "Voir tous les témoignages" }],
    },
    sitemap: 0.7,
    llms: "Résultats clients contextualisés, témoignages vidéo et captures de retours, sans garantie ni cas générique inventé.",
    llmsSection: "principales",
  },
  {
    path: "/hooks-tiktok",
    title: `Hooks TikTok : ${HOOKS_TOTAL_COUNT} accroches classées | Fred Wav`,
    description: `Les hooks TikTok (ou accroches) rangés par famille : curiosité, suspense, urgence, émotion. ${HOOKS_PUBLISHED_COUNT} exemples en clair, ce que chaque famille coûte quand on en abuse, et le guide complet en PDF.`,
    ogType: "article",
    noscript: {
      h1: `Hooks TikTok : ${HOOKS_TOTAL_COUNT} accroches classées par famille`,
      body: `Un hook, c'est la première seconde qui décide si ton spectateur reste ou scrolle. Voici ${HOOKS_PUBLISHED_COUNT} accroches classées en ${HOOK_CATEGORIES.length} familles, avec pour chacune ce qu'elle coûte quand on en abuse. Le guide complet (${HOOKS_TOTAL_COUNT} accroches, modèles à compléter et grille de notation) est disponible par email.`,
      sections: [
        { h2: "Un hook TikTok, c'est quoi exactement ?", body: "Les deux premières secondes de ta vidéo, celles qui décident si le spectateur reste ou passe à la suivante. Le hook, c'est la raison qu'il a de ne pas scroller." },
        { h2: `Les ${HOOK_CATEGORIES.length} familles de hooks TikTok, avec des exemples`, body: HOOK_CATEGORIES.map((c) => c.label).join(", ") + ". Chaque famille avec des exemples concrets et ce qu'elle coûte quand on la surexploite." },
        { h2: "Pourquoi je ne te promets pas de vues avec ces hooks", body: "Un hook gagne l'attention des deux premières secondes, pas la diffusion. Personne ne contrôle l'algorithme. Ce que tu contrôles, c'est ta rétention sur les trois premières secondes, et ça se travaille." },
        { h2: "Le guide complet des hooks TikTok en PDF", body: `Toutes les accroches classées, les modèles à compléter avec ton sujet et une grille pour noter un hook avant de tourner. Par email, gratuitement.` },
        { h2: "Questions fréquentes sur les hooks TikTok", body: HOOKS_FAQ.slice(0, 4).map((f) => f.question).join(" ") },
      ],
      links: [
        { href: "/newsletter", label: "Recevoir le guide complet des hooks en PDF" },
        { href: "/wavacademy", label: "Wav Academy — ne poste plus seul" },
      ],
    },
    schema: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `Hooks TikTok : ${HOOKS_TOTAL_COUNT} accroches classées par famille`,
        description: `Les hooks TikTok rangés par famille, avec ${HOOKS_PUBLISHED_COUNT} exemples en clair et ce que chaque famille coûte quand on en abuse.`,
        image: OG_IMAGE,
        inLanguage: "fr-FR",
        author: { "@type": "Person", name: "Fred Wav", url: `${BASE_URL}/a-propos` },
        publisher: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
        datePublished: "2026-08-05",
        dateModified: "2026-08-05",
        mainEntityOfPage: `${BASE_URL}/hooks-tiktok`,
    },
    sitemap: 0.7,
    llms: `Les hooks TikTok (accroches) classés en ${HOOK_CATEGORIES.length} familles, avec ${HOOKS_PUBLISHED_COUNT} exemples en clair et ce que chaque famille coûte. Guide complet (${HOOKS_TOTAL_COUNT} accroches, modèles à compléter, grille de notation) par email.`,
    llmsSection: "ressources",
  },
  {
    path: "/ressources",
    title: "Ressources TikTok : statistiques, vues et rétention | Fred Wav",
    description:
      "Des guides concrets pour lire tes statistiques TikTok, diagnostiquer un manque de vues et améliorer la rétention de tes vidéos.",
    noscript: {
      h1: "Ressources TikTok : transforme tes statistiques en décisions",
      body: "Choisis le symptôme que tu observes, comprends les métriques utiles et teste une seule correction à la fois.",
      links: [
        { href: "/ressources/statistiques-tiktok", label: "Comprendre les statistiques TikTok" },
        { href: "/ressources/vues-tiktok", label: "Diagnostiquer un manque de vues" },
        { href: "/ressources/retention-tiktok", label: "Améliorer la rétention TikTok" },
      ],
    },
    sitemap: 0.8,
    llms: "Centre de ressources pour relier statistiques, vues et rétention TikTok à des décisions éditoriales concrètes.",
    llmsSection: "ressources",
  },
  {
    path: "/ressources/statistiques-tiktok",
    title: "Statistiques TikTok : métriques et méthode d'analyse | Fred Wav",
    description:
      "Temps de visionnage, rétention, complétion et engagement : apprends à lire les statistiques TikTok dans le bon ordre et à choisir quoi corriger.",
    ogType: "article",
    noscript: {
      h1: "Statistiques TikTok : comprendre les métriques et savoir quoi corriger",
      body: "Une méthode de lecture qui relie temps de visionnage, rétention, complétion et engagement sans isoler un chiffre de son contexte.",
      links: [
        { href: "/ressources/vues-tiktok", label: "Pourquoi mes TikTok font peu de vues ?" },
        { href: "/ressources/retention-tiktok", label: "Comprendre la rétention TikTok" },
      ],
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Statistiques TikTok : comprendre les métriques et savoir quoi corriger",
      description:
        "Temps de visionnage, rétention, complétion et engagement : une méthode pour lire les statistiques TikTok dans le bon ordre.",
      image: OG_IMAGE,
      author: { "@type": "Person", name: "Fred Wav", url: `${BASE_URL}/a-propos` },
      publisher: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
      datePublished: "2026-08-11",
      dateModified: "2026-08-11",
      mainEntityOfPage: `${BASE_URL}/ressources/statistiques-tiktok`,
      inLanguage: "fr-FR",
    },
    sitemap: 0.7,
    llms: "Guide pour interpréter temps de visionnage, rétention, complétion et engagement TikTok dans le bon ordre.",
    llmsSection: "ressources",
  },
  {
    path: "/ressources/vues-tiktok",
    title: "Pourquoi mes TikTok font peu de vues ? | Fred Wav",
    description:
      "Un diagnostic étape par étape pour distinguer problème de compte, accroche floue, rétention faible et manque de cohérence éditoriale sur TikTok.",
    ogType: "article",
    noscript: {
      h1: "Pourquoi mes TikTok font peu de vues ? Le diagnostic étape par étape",
      body: "Le nombre de vues arrive à la fin du diagnostic : vérifie le compte, la promesse des premières secondes, la rétention et la cohérence du contenu.",
      links: [
        { href: "/ressources/statistiques-tiktok", label: "Comprendre les statistiques TikTok" },
        { href: "/ressources/retention-tiktok", label: "Améliorer la rétention TikTok" },
      ],
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Pourquoi mes TikTok font peu de vues ? Le diagnostic étape par étape",
      description:
        "Un diagnostic étape par étape pour distinguer problème de compte, accroche floue, rétention faible et manque de cohérence éditoriale.",
      image: OG_IMAGE,
      author: { "@type": "Person", name: "Fred Wav", url: `${BASE_URL}/a-propos` },
      publisher: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
      datePublished: "2026-08-11",
      dateModified: "2026-08-11",
      mainEntityOfPage: `${BASE_URL}/ressources/vues-tiktok`,
      inLanguage: "fr-FR",
    },
    sitemap: 0.7,
    llms: "Diagnostic des faibles vues TikTok fondé sur l'état du compte, la clarté de la promesse, la rétention et la cohérence éditoriale.",
    llmsSection: "ressources",
  },
  {
    path: "/ressources/retention-tiktok",
    title: "Rétention TikTok : lire la courbe et l'améliorer | Fred Wav",
    description:
      "Apprends à lire une courbe de rétention TikTok, localiser les chutes d'audience et choisir le test utile pour ta prochaine vidéo.",
    ogType: "article",
    noscript: {
      h1: "Rétention TikTok : comprendre la courbe et améliorer la vidéo",
      body: "Repère où l'audience décroche, distingue le hook du corps de la vidéo et transforme la courbe en un seul test concret.",
      links: [
        { href: "/ressources/statistiques-tiktok", label: "Comprendre les statistiques TikTok" },
        { href: "/ressources/vues-tiktok", label: "Diagnostiquer un manque de vues" },
      ],
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Rétention TikTok : comprendre la courbe et améliorer la vidéo",
      description:
        "Une méthode pour lire une courbe de rétention TikTok, localiser les chutes d'audience et choisir une correction mesurable.",
      image: OG_IMAGE,
      author: { "@type": "Person", name: "Fred Wav", url: `${BASE_URL}/a-propos` },
      publisher: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
      datePublished: "2026-08-11",
      dateModified: "2026-08-11",
      mainEntityOfPage: `${BASE_URL}/ressources/retention-tiktok`,
      inLanguage: "fr-FR",
    },
    sitemap: 0.7,
    llms: "Guide pour lire une courbe de rétention TikTok, localiser les chutes d'audience et choisir une correction mesurable.",
    llmsSection: "ressources",
  },
  {
    path: "/a-propos",
    title: "Fred Wav — consultant en stratégie réseaux sociaux",
    description:
      "Découvre le parcours et la méthode de Fred Wav, créateur, formateur et consultant en stratégie sur TikTok, Instagram, YouTube et Facebook.",
    noscript: {
      h1: "Je ne t'aide pas à poster plus. Je t'aide à comprendre quoi faire ensuite.",
      body: "Fred Wav est créateur de contenu, formateur et consultant en stratégie réseaux sociaux. Son expertise historique vient de TikTok et des formats courts, mais ses accompagnements peuvent aussi intégrer Instagram, YouTube, Facebook et les stratégies multiréseaux. Son approche repose sur le contexte, les contenus, les statistiques, le positionnement et les objectifs réels.",
      links: [{ href: "/preuves", label: "Voir les résultats" }],
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Fred Wav",
      jobTitle: "Consultant en stratégie réseaux sociaux",
      url: `${BASE_URL}/a-propos`,
      knowsAbout: [
        "Stratégie formats courts",
        "Stratégie TikTok",
        "Stratégie Instagram",
        "Stratégie YouTube",
        "Stratégie Facebook",
        "Marketing vidéo",
        "Hook engineering",
        "Réseaux sociaux",
        "Croissance organique",
      ],
      sameAs: [
        "https://www.tiktok.com/@fredwav",
        "https://www.instagram.com/levraifredwav/",
        "https://www.youtube.com/@Fredwavconseils",
      ],
    },
    sitemap: 0.6,
    llms: "Présentation de Fred Wav, créateur, formateur et consultant en stratégie réseaux sociaux sur TikTok, Instagram, YouTube, Facebook et les formats courts.",
    llmsSection: "principales",
  },
  {
    path: "/newsletter",
    title: "La newsletter de Fred Wav — un mail, du concret",
    description:
      "Reçois mes conseils formats courts par email, et le guide complet des hooks TikTok en cadeau de bienvenue. Sans spam, désinscription en un clic.",
    noscript: {
      h1: "La newsletter de Fred Wav",
      body: "Mes conseils formats courts par email, et le guide complet des hooks TikTok pour commencer. La page /hooks-tiktok te donne déjà les familles d'accroches en clair.",
      links: [
        { href: "/hooks-tiktok", label: "Voir les hooks classés par famille" },
        { href: "/wavacademy", label: "Wav Academy — ne poste plus seul" },
      ],
    },
    sitemap: 0.4,
    llms: "Inscription à la newsletter de Fred Wav ; le guide complet des hooks TikTok est offert à l'inscription.",
    llmsSection: "ressources",
  },
  {
    path: "/contact",
    title: "Contact — Fred Wav | Expert Formats Courts",
    description:
      "Contacte Fred Wav par email ou via les réseaux sociaux. Réponse sous 24-48h en semaine.",
    noscript: {
      h1: "Contacter Fred Wav",
      body: "Une question sur les offres ou la méthode ? Écris à contact@fredwav.com, réponse sous 24 à 48h en semaine.",
    },
    sitemap: 0.5,
    llms: "Adresse email et réseaux sociaux officiels pour contacter Fred Wav ; réponse annoncée sous 24 à 48 heures en semaine.",
    llmsSection: "principales",
  },
  {
    path: "/cgv",
    title: "Conditions Générales de Vente | Fred Wav",
    description:
      "CGV applicables aux prestations de conseil en stratégie de contenu et aux Pass Wav Academy proposés par Fred Wav.",
    noscript: {
      h1: "Conditions Générales de Vente",
      body: "Conditions applicables aux Pass Wav Academy, à l'Analyse Express et aux prestations d'accompagnement.",
    },
    sitemap: 0.2,
    llms: "CGV du site.",
    llmsSection: "legales",
  },
  {
    path: "/mentions-legales",
    title: "Mentions légales | Fred Wav",
    description:
      "Mentions légales du site fredwav.com — éditeur, hébergeur, propriété intellectuelle et données personnelles.",
    noscript: {
      h1: "Mentions légales",
      body: "Éditeur, hébergeur, propriété intellectuelle et traitement des données personnelles du site fredwav.com.",
    },
    sitemap: 0.2,
    llms: "Informations légales de l'entreprise.",
    llmsSection: "legales",
  },
  {
    path: "/politique-de-confidentialite",
    title: "Politique de confidentialité | Fred Wav",
    description:
      "Politique de confidentialité du site fredwav.com — collecte, utilisation et protection de tes données personnelles conformément au RGPD.",
    noscript: {
      h1: "Politique de confidentialité",
      body: "Comment les données personnelles sont collectées, utilisées et protégées, conformément au RGPD.",
    },
    sitemap: 0.2,
    llms: "Politique de gestion des données personnelles et cookies.",
    llmsSection: "legales",
  },
];

const ALLOWED_SCHEMA_TYPES = new Set(["Product", "Course", "Person", "Article", "BreadcrumbList"]);

function routeKind(path: string): Exclude<RouteKind, "redirect"> {
  if (["/wavacademy", "/analyse-express", "/reserverunappel"].includes(path)) return "commercial";
  if (["/cgv", "/mentions-legales", "/politique-de-confidentialite"].includes(path)) return "legal";
  return "content";
}

/** Un seul graphe route-scoped, composé uniquement des types autorisés. */
function buildRouteSchema(route: RouteSeo, indexable: boolean): Record<string, unknown> | undefined {
  if (!indexable) return undefined;

  const nodes = route.schema ? (Array.isArray(route.schema) ? [...route.schema] : [route.schema]) : [];
  if (route.path.startsWith("/ressources/")) {
    const name = route.title.split(/[—|]/)[0].trim();
    nodes.push(breadcrumbSchema(route.path, name));
  }

  const graph = nodes.map((node) => {
    const { "@context": _context, ...withoutContext } = node;
    const type = withoutContext["@type"];
    if (typeof type !== "string" || !ALLOWED_SCHEMA_TYPES.has(type)) {
      throw new Error(`[seo] Type JSON-LD interdit sur ${route.path}: ${String(type)}`);
    }
    return withoutContext;
  });

  return graph.length
    ? {
        "@context": "https://schema.org",
        "@graph": graph,
      }
    : undefined;
}

const ssgManifest: SsgRouteManifestEntry[] = ROUTES.map((route) => {
  const indexable = route.path !== "/start";
  return {
    ...route,
    kind: routeKind(route.path),
    render: "ssg",
    indexable,
    private: false,
    canonical: `${BASE_URL}${route.path === "/" ? "/" : route.path}`,
    sitemap: indexable ? (route.sitemap ?? 0.5) : false,
    schema: buildRouteSchema(route, indexable),
    noindex: !indexable,
    status: 200,
  };
});

type CsrDefinition = {
  path: string;
  title: string;
  description?: string;
  private?: boolean;
  clientBoundary?: ClientBoundary;
};

const csrManifest: CsrRouteManifestEntry[] = ([
  {
    path: "/start",
    title: "Diagnostic stratégique TikTok gratuit | Fred Wav",
    description: "Funnel interactif de diagnostic TikTok, volontairement exclu de l'indexation.",
  },
  { path: "/auth", title: "Connexion | Fred Wav", clientBoundary: "auth" },
  { path: "/auth/reset-password", title: "Réinitialisation du mot de passe | Fred Wav", clientBoundary: "auth" },
  { path: "/admin", title: "Administration | Fred Wav", private: true, clientBoundary: "admin" },
  { path: "/admin/settings", title: "Paramètres | Fred Wav", private: true, clientBoundary: "admin" },
  { path: "/admin/analyses", title: "Analyses Express | Fred Wav", private: true, clientBoundary: "admin" },
  { path: "/admin/applications", title: "Candidatures | Fred Wav", private: true, clientBoundary: "admin" },
  { path: "/admin/marketing", title: "Marketing | Fred Wav", private: true, clientBoundary: "admin" },
  { path: "/admin/deep-links", title: "Liens de redirection | Fred Wav", private: true, clientBoundary: "admin" },
  { path: "/admin/testimonials", title: "Témoignages | Fred Wav", private: true, clientBoundary: "admin" },
  { path: "/admin/wavacademy-consents", title: "Consentements Wav Academy | Fred Wav", private: true, clientBoundary: "admin" },
  { path: "/analyse-express/result", title: "Résultat de l'Analyse Express | Fred Wav" },
  { path: "/processing", title: "Diagnostic en cours | Fred Wav" },
  { path: "/result", title: "Résultat du diagnostic | Fred Wav" },
  { path: "/claim/error", title: "Accès personnel | Fred Wav" },
  { path: "/claim/:token", title: "Accès personnel | Fred Wav" },
  { path: "/go/:slug", title: "Redirection | Fred Wav" },
  { path: "/retractation", title: "Formulaire de rétractation | Fred Wav" },
 ] satisfies CsrDefinition[]).map<CsrRouteManifestEntry>((route) => ({
  path: route.path,
  title: route.title,
  description:
    "description" in route
      ? route.description
      : "Cette page fonctionnelle n'est pas destinée aux résultats de recherche.",
  kind: route.private ? "private" : "functional",
  render: "csr",
  indexable: false,
  private: route.private ?? false,
  clientBoundary: route.clientBoundary ?? "none",
  noindex: true,
  canonical: false,
  sitemap: false,
  status: 200,
}));

const redirectDefinitions: [string, string, 307 | 308][] = [
  ["/offres", "/", 308],
  ["/45-jours", "/reserverunappel", 308],
  ["/offres/45-jours", "/reserverunappel", 308],
  ["/offres/vip", "/wavacademy", 308],
  ["/one-shot", "/reserverunappel", 308],
  ["/accompagnement-reseaux-sociaux", "/reserverunappel", 308],
  ["/accompagnement-tiktok", "/wavacademy", 308],
  ["/one-shot/success", "/", 307],
  ["/mail", "/newsletter", 308],
  ["/wav-premium/candidature", "/reserverunappel", 308],
];

const redirectManifest: RedirectRouteManifestEntry[] = redirectDefinitions.map<RedirectRouteManifestEntry>(
  ([path, redirectTo, status]) => ({
  path,
  redirectTo,
  title: "Redirection | Fred Wav",
  description: `Redirection permanente vers ${redirectTo}.`,
  kind: "redirect",
  render: "redirect",
  indexable: false,
  private: false,
  noindex: true,
  canonical: false,
  sitemap: false,
  status,
  }),
);

/** Source typée unique pour le rendu, le SEO, le SSG et l'hébergement. */
export const ROUTE_MANIFEST: readonly RouteManifestEntry[] = [
  ...ssgManifest,
  ...csrManifest,
  ...redirectManifest,
];

export const ROUTE_SEO: readonly SsgRouteManifestEntry[] = ROUTE_MANIFEST.filter(
  (route): route is SsgRouteManifestEntry => route.render === "ssg",
);

/** Accès par chemin — utilisé par les pages : <SEOHead {...seoFor("/wavacademy")} /> */
export function seoFor(path: string): RouteSeo {
  const found = ROUTE_MANIFEST.find((route) => route.path === path && route.render !== "redirect");
  if (!found) throw new Error(`[seo] Route inconnue : ${path}. Ajoute-la dans ROUTE_MANIFEST.`);
  return found;
}
