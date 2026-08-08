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
  ACADEMY_FROM,
  ACADEMY_ENTRY,
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
    question: "Par où je commence ?",
    answer: `La Wav Academy, dans la quasi-totalité des cas : tu n'es plus seul pour créer. Tu as un regard régulier sur ton travail, un live chaque semaine ${ACADEMY_LIVE_SLOT}, un suivi ${ACADEMY_SUPPORT_DAYS} et du feedback sur tes contenus à la demande. Tu accèdes aussi aux modules, aux guides et à l'outil WavStats, à partir de ${ACADEMY_FROM} € pour ${ACADEMY_ENTRY.duration} d'accès, en paiement unique. Si tu veux d'abord un état des lieux de ton compte, l'Analyse Express te le donne pour 11,90 €.`,
  },
  {
    question: "Quelle différence entre la Wav Academy et le Wav Premium ?",
    answer: `La Wav Academy, c'est un cadre collectif avec des retours réguliers : mes lives, mon regard sur tes contenus et la communauté pour ne jamais rester bloqué. Le Wav Premium, c'est ${PREMIUM_DURATION_DAYS} jours de suivi individuel et intensif avec moi sur ton compte, sur candidature. L'Academy convient à la grande majorité des créateurs.`,
  },
  {
    question: "La Wav Academy, c'est un abonnement ?",
    answer: "Non. Les trois Pass (3, 6 et 12 mois) sont des paiements uniques, sans reconduction et sans rien à résilier. Tu paies une fois, tu accèdes à tout pendant la durée choisie, et l'accès s'arrête au terme.",
  },
  {
    question: "Est-ce que ça marche dans mon domaine ?",
    answer: "La méthode part de tes propres données, donc elle s'adapte à ton secteur : coaching, e-commerce, artisanat, services, formation. Ce qui change d'un domaine à l'autre, c'est le sujet des vidéos, pas la façon de lire les résultats.",
  },
  {
    question: "Combien de temps ça me prend par semaine ?",
    answer: `Compte 3 à 5 heures par semaine pour créer et appliquer les retours. Le live a lieu ${ACADEMY_LIVE_SLOT}, et tes questions sont suivies ${ACADEMY_SUPPORT_DAYS}.`,
  },
  {
    question: "Je débute, c'est trop tôt ?",
    answer: "Non, c'est même le meilleur moment. Mieux vaut démarrer avec une méthode que de poster six mois dans le vide puis devoir tout défaire.",
  },
  {
    question: "Comment se passe le paiement ?",
    answer: "Paiement sécurisé via Stripe. Jusqu'à 4× sans frais avec PayPal et 3× sans frais avec Klarna, sous réserve d'acceptation.",
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
    title: "Fred Wav — Expert Stratégie Formats Courts",
    description:
      "Comprends ce qui fonctionne dans tes contenus, ce qui ne fonctionne pas et pourquoi. Ne crée plus seul : rejoins la Wav Academy.",
    keywords:
      "stratégie formats courts, accompagnement créateur de contenu, coach réseaux sociaux formats courts, Fred Wav, ne plus créer seul",
    noscript: {
      h1: "Arrête de poster seul. Tes stats disent déjà ce qui bloque.",
      body: "Pas d'astuces d'algorithme, pas de promesses. On part de tes vraies données pour comprendre ce qui fonctionne, ce qui ne fonctionne pas et pourquoi. Trois façons de travailler ensemble : la Wav Academy (l'offre principale), l'Analyse Express et le Wav Premium.",
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
    llms: "Landing principale : la Wav Academy, l'Analyse Express et le Wav Premium, avec témoignages et preuves.",
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
    title: "Contacter Fred Wav — premier échange",
    description:
      "Premier contact avec Fred Wav : décris ta situation et je t'oriente vers la solution adaptée.",

    keywords:
      "contact fred wav, premier contact, réserver un appel, diagnostic contenu, accompagnement formats courts",
    noscript: {
      h1: "Premier contact avec Fred Wav",
      body: `Décris ta situation et tes objectifs : je te réponds par écrit et je t'oriente vers ce qui correspond réellement à ton besoin - audit de compte, session live ou accompagnement individuel de ${PREMIUM_DURATION_DAYS} jours.`,
      links: [{ href: "/reserverunappel", label: "Prendre contact" }],
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Premier contact avec Fred Wav",
      description:
        "Formulaire de premier contact : décris ta situation, Fred Wav répond par écrit et oriente vers la solution adaptée.",
      about: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
      url: `${BASE_URL}/reserverunappel`,
    },
    sitemap: 0.8,
    llms: "Formulaire de premier contact avec Fred Wav : orientation vers l'offre adaptée (audit, session live ou accompagnement individuel) après réponse écrite.",
    llmsSection: "offres",
  },
  {
    path: "/preuves",
    title: "Témoignages et résultats clients | Fred Wav",
    description:
      "Découvre les résultats concrets de mes clients : témoignages vidéo, études de cas et retours d'expérience documentés.",
    keywords:
      "témoignages formats courts, résultats clients, études de cas, retours expérience, preuves",
    noscript: {
      h1: "Des résultats, pas des promesses",
      body: "Ce que mes clients ont accompli en appliquant la méthode : témoignages vidéo, captures de résultats et cas concrets. Pas de chiffres gonflés.",
      links: [{ href: "/preuves", label: "Voir tous les témoignages" }],
    },
    sitemap: 0.7,
    llms: "Avant/après, résultats clients et preuves sociales (témoignages vidéo, captures).",
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
    title: "Qui est Fred Wav — parcours et méthode formats courts",
    description:
      "Le parcours et la méthode de Fred Wav : des années d'expérience vidéo, des centaines de créateurs accompagnés. Stratégie, analyse, performance mesurable.",
    keywords:
      "Fred Wav, expert formats courts, parcours, méthode data-driven, accompagnement créateur",
    noscript: {
      h1: "Je suis là pour tes résultats, pas pour te vendre du rêve",
      body: "Stratégiste en contenu et formats courts, j'accompagne entrepreneurs et créateurs à construire une présence qui sert vraiment leurs objectifs — des clients, ou la visibilité qui attire les marques — pas juste des vues sans lendemain. Mon approche : stratégie, analyse, performance mesurable.",
      links: [{ href: "/preuves", label: "Voir les résultats" }],
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Fred Wav",
      jobTitle: "Expert Stratégie Formats Courts",
      url: `${BASE_URL}/a-propos`,
      knowsAbout: [
        "Stratégie formats courts",
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
    llms: "Présentation de Fred Wav, son parcours et sa philosophie sur la création de contenu.",
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
