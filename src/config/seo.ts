/**
 * Source de vérité unique des métadonnées par route.
 *
 * Utilisé à deux endroits :
 *  1. au runtime, par <SEOHead /> dans chaque page ;
 *  2. au build, par le plugin de prerender de vite.config.ts, qui écrit une
 *     coquille HTML distincte par route (title / description / canonical / OG /
 *     JSON-LD / noscript) et génère sitemap.xml + llms.txt.
 *
 * Les deux lisent la même map : impossible que le HTML servi aux robots diverge
 * de celui rendu par React. C'est ce qui manquait et qui avait laissé llms.txt
 * afficher des prix Academy morts pendant des mois.
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
import { WAVACADEMY_FAQ } from "./wavacademy-faq";
import { HOOKS_FAQ } from "./hooks-faq";
import { HOOK_CATEGORIES, HOOKS_PUBLISHED_COUNT, HOOKS_TOTAL_COUNT } from "../data/hooks";


export const BASE_URL = "https://fredwav.com";
export const OG_IMAGE = `${BASE_URL}/og-image.png`;

export type RouteSeo = {
  path: string;
  title: string;
  description: string;
  keywords?: string;
  /**
   * Contenu servi dans le <noscript> de la coquille prerendue.
   * `sections` (facultatif) : des couples titre + résumé, pour donner de la
   * matière aux crawlers qui n'exécutent pas JavaScript (robots des IA) sur les
   * pages éditoriales, là où un titre et un paragraphe ne suffisent pas.
   */
  noscript: {
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

const academyPricing = ACADEMY_PLANS.map((p) => `${p.duration} (${p.total} €)`).join(", ");

/**
 * FAQ de la home. Vit ici pour que l'accordéon affiché et le JSON-LD FAQPage
 * prerendu proviennent de la même source — Google sanctionne un FAQPage dont les
 * questions ne sont pas visibles sur la page.
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

/**
 * Fil d'Ariane « Accueil › la page ». Le site est plat — aucune page n'a de
 * parent réel — donc deux niveaux suffisent, et en afficher plus serait faux.
 */
function breadcrumbSchema(path: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
      { "@type": "ListItem", position: 2, name, item: `${BASE_URL}${path}` },
    ],
  };
}

const ROUTES: RouteSeo[] = [
  {
    path: "/",
    title: "Fred Wav — stratégie réseaux sociaux et contenus",
    description:
      "Comprends ce que racontent tes contenus et prends de meilleures décisions sur TikTok, Instagram, YouTube et Facebook avec Fred Wav.",
    keywords:
      "stratégie réseaux sociaux, création de contenu, formats courts, TikTok, Instagram, YouTube, Facebook, statistiques réseaux sociaux, consultant réseaux sociaux, accompagnement créateurs entrepreneurs, Fred Wav",
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
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: HOME_FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
    // Pas de fil d'Ariane sur l'accueil : c'est la racine. Le précédent
    // annonçait Accueil > Academy > Témoignages, un chemin de navigation
    // qui n'existe nulle part sur le site.
    sitemap: 1.0,
    llms: "Stratégie de contenu et réseaux sociaux avec Fred Wav : Wav Academy comme offre principale, Analyse Express automatisée uniquement pour TikTok, et Wav Premium individuel sur TikTok, Instagram, YouTube ou Facebook.",
    llmsSection: "principales",
  },
  {
    path: "/wavacademy",
    title: "Wav Academy — accompagnement créateurs | Fred Wav",
    description: `Accompagnement régulier pour créateurs : live, feedback, ${ACADEMY_MODULES_COUNT} modules et ${ACADEMY_GUIDES_COUNT} guides. Pass ${ACADEMY_PLANS.map((p) => p.duration).join(", ")} en paiement unique.`,

    keywords:
      "wav academy, formation tiktok, accompagnement tiktok, wavstats, accompagnement créateur, formats courts, communauté créateurs",
    noscript: {
      h1: "Wav Academy — ne poste plus seul, comprends pourquoi ton contenu fonctionne ou bloque",
      body: `Un accompagnement régulier : un live hebdomadaire ${ACADEMY_LIVE_SLOT}, un suivi ${ACADEMY_SUPPORT_DAYS}, du feedback sur tes contenus à la demande, un Discord premium, ${ACADEMY_MODULES_COUNT} modules de formation et ${ACADEMY_GUIDES_COUNT} guides téléchargeables. Trois Pass prépayés : ${academyPricing}. Paiement unique, sans abonnement ni reconduction.`,
      links: [{ href: "/wavacademy", label: "Voir les formules Wav Academy" }],
    },
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "Course",
        name: "Wav Academy",
        description: `Accompagnement pour créateurs de contenu : live hebdomadaire, suivi ${ACADEMY_SUPPORT_DAYS}, feedback sur les contenus à la demande, ${ACADEMY_MODULES_COUNT} modules de formation, ${ACADEMY_GUIDES_COUNT} guides téléchargeables et outil d'analyse WavStats inclus.`,
        provider: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
        url: `${BASE_URL}/wavacademy`,
        inLanguage: "fr-FR",
        offers: ACADEMY_PLANS.map((p) => ({
          "@type": "Offer",
          name: `Pass ${p.label} — ${p.duration}`,
          price: String(p.total),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${BASE_URL}/wavacademy`,
        })),
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "PT2H",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: WAVACADEMY_FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],

    sitemap: 0.9,
    llms: `Accompagnement régulier pour créateurs (live hebdomadaire, suivi ${ACADEMY_SUPPORT_DAYS}, feedback à la demande, Discord premium, ${ACADEMY_MODULES_COUNT} modules, ${ACADEMY_GUIDES_COUNT} guides et outil d'analyse WavStats). Trois Pass prépayés, paiement unique sans abonnement : ${academyPricing}.`,
    llmsSection: "offres",
  },
  {
    path: "/analyse-express",
    title: "Analyse Express — audit TikTok | Fred Wav",
    description: `Audit TikTok automatisé : health score, métriques, persona et plan d'action. Rapport PDF à ${EXPRESS_PRICE.toFixed(2).replace(".", ",")} €.`,

    keywords:
      "audit tiktok, audit compte tiktok, diagnostic compte tiktok, health score tiktok, analyse compte tiktok",
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
        "@type": "Offer",
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

    keywords:
      "Wav Premium, accompagnement réseaux sociaux, consultant réseaux sociaux, stratégie TikTok Instagram YouTube Facebook, accompagnement individuel contenu, Fred Wav",
    noscript: {
      h1: `Wav Premium — ${PREMIUM_DURATION_DAYS} jours d'accompagnement individuel`,
      body: "Présente ta situation, tes réseaux, tes objectifs, ton blocage et le résultat que tu attends. L'accompagnement peut porter sur TikTok, Instagram, YouTube, Facebook ou une stratégie qui combine plusieurs plateformes. Fred lit chaque demande avant de proposer un appel.",
      links: [{ href: "/reserverunappel", label: "Envoyer ma demande Wav Premium" }],
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Wav Premium avec Fred Wav",
      description:
        `Formulaire de qualification pour un accompagnement individuel de ${PREMIUM_DURATION_DAYS} jours en stratégie réseaux sociaux.`,
      about: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
      url: `${BASE_URL}/reserverunappel`,
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
    keywords:
      "témoignages formats courts, résultats clients contextualisés, retours expérience, preuves Fred Wav",
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
    keywords:
      "hook tiktok, hooks tiktok, accroches tiktok, phrase d'accroche tiktok, exemples de hooks tiktok, accroche vidéo courte",
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
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `Hooks TikTok : ${HOOKS_TOTAL_COUNT} accroches classées par famille`,
        description: `Les hooks TikTok rangés par famille, avec ${HOOKS_PUBLISHED_COUNT} exemples en clair et ce que chaque famille coûte quand on en abuse.`,
        inLanguage: "fr-FR",
        author: { "@type": "Person", name: "Fred Wav", url: `${BASE_URL}/a-propos` },
        publisher: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
        datePublished: "2026-08-05",
        dateModified: "2026-08-05",
        mainEntityOfPage: `${BASE_URL}/hooks-tiktok`,
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Familles de hooks TikTok",
        itemListElement: HOOK_CATEGORIES.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.label,
          url: `${BASE_URL}/hooks-tiktok#hooks-${c.slug}`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: HOOKS_FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
    sitemap: 0.7,
    llms: `Les hooks TikTok (accroches) classés en ${HOOK_CATEGORIES.length} familles, avec ${HOOKS_PUBLISHED_COUNT} exemples en clair et ce que chaque famille coûte. Guide complet (${HOOKS_TOTAL_COUNT} accroches, modèles à compléter, grille de notation) par email.`,
    llmsSection: "ressources",
  },
  {
    path: "/a-propos",
    title: "Fred Wav — consultant en stratégie réseaux sociaux",
    description:
      "Découvre le parcours et la méthode de Fred Wav, créateur, formateur et consultant en stratégie sur TikTok, Instagram, YouTube et Facebook.",
    keywords:
      "Fred Wav, consultant réseaux sociaux, stratégie TikTok Instagram YouTube Facebook, créateur de contenu, formateur, accompagnement créateurs entrepreneurs",
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
    keywords: "newsletter fred wav, conseils tiktok par email, guide hooks tiktok, Fred Wav",
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
    keywords: "contact Fred Wav, question formats courts, réseaux sociaux, email",
    noscript: {
      h1: "Contacter Fred Wav",
      body: "Une question sur les offres ou la méthode ? Écris à contact@fredwav.com, réponse sous 24 à 48h en semaine.",
    },
    sitemap: 0.5,
    llms: "Formulaire de contact pour toute demande.",
    llmsSection: "principales",
  },
  {
    path: "/start",
    title: "Diagnostic stratégique TikTok gratuit | Fred Wav",
    description:
      "Identifie ton point de blocage exact sur TikTok en 2 minutes. Diagnostic gratuit pour t'orienter vers la bonne stratégie.",
    keywords: "diagnostic TikTok gratuit, audit TikTok, stratégie TikTok, blocage TikTok, Fred Wav",
    noscript: {
      h1: "Diagnostic stratégique gratuit",
      body: "Sept questions pour identifier ton point de blocage et t'orienter vers l'offre adaptée. Gratuit, en 2 minutes.",
    },
    sitemap: 0.4,
    llms: "Funnel de 7 questions pour évaluer ta maturité TikTok et découvrir l'offre adaptée.",
    llmsSection: "ressources",
  },
  {
    path: "/cgv",
    title: "Conditions Générales de Vente | Fred Wav",
    description:
      "CGV applicables aux prestations de conseil en stratégie de contenu et aux Pass Wav Academy proposés par Fred Wav.",
    keywords: "conditions générales, cgv",
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
    keywords: "mentions légales, éditeur, hébergeur",
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
    keywords: "politique de confidentialité, RGPD, données personnelles",
    noscript: {
      h1: "Politique de confidentialité",
      body: "Comment les données personnelles sont collectées, utilisées et protégées, conformément au RGPD.",
    },
    sitemap: 0.2,
    llms: "Politique de gestion des données personnelles et cookies.",
    llmsSection: "legales",
  },
];

/** Accès par chemin — utilisé par les pages : <SEOHead {...seoFor("/wavacademy")} /> */
/**
 * Ajoute son fil d'Ariane à chaque page hors accueil.
 *
 * Généré ici plutôt que recopié dans chaque route : c'est mécanique, et un
 * oubli dans une liste de douze entrées passerait inaperçu. Le libellé reprend
 * la partie du titre qui précède le tiret, comme llms.txt.
 */
export const ROUTE_SEO: RouteSeo[] = ROUTES.map((route) => {
  if (route.path === "/") return route;
  const name = route.title.split(/[—|]/)[0].trim();
  const existants = route.schema
    ? Array.isArray(route.schema)
      ? route.schema
      : [route.schema]
    : [];
  return { ...route, schema: [...existants, breadcrumbSchema(route.path, name)] };
});

export function seoFor(path: string): RouteSeo {
  const found = ROUTE_SEO.find((r) => r.path === path);
  if (!found) throw new Error(`[seo] Route inconnue : ${path}. Ajoute-la dans src/config/seo.ts.`);
  return found;
}
