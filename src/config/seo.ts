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

import { ACADEMY_PLANS, ACADEMY_FROM, ACADEMY_ENTRY, EXPRESS_PRICE, PREMIUM_DURATION_DAYS } from "./offers";

export const BASE_URL = "https://fredwav.com";
export const OG_IMAGE = `${BASE_URL}/og-image.png`;

export type RouteSeo = {
  path: string;
  title: string;
  description: string;
  keywords?: string;
  /** Titre visible et paragraphe servis dans le <noscript> de la coquille prerendue. */
  noscript: { h1: string; body: string; links?: { href: string; label: string }[] };
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
    answer: `La Wav Academy, dans la quasi-totalité des cas : tu accèdes à la méthode, à l'outil de diagnostic, au live hebdo et à la communauté à partir de ${ACADEMY_FROM} € pour ${ACADEMY_ENTRY.duration} d'accès, en paiement unique. Si tu veux d'abord un état des lieux de ton compte, l'Analyse Express te le donne pour 11,90 €.`,
  },
  {
    question: "Quelle différence entre la Wav Academy et le Wav Premium ?",
    answer: `La Wav Academy, c'est la méthode, les outils et un cadre régulier : tu appliques toi-même, avec la communauté et mes lives pour ne jamais rester bloqué. Le Wav Premium, c'est ${PREMIUM_DURATION_DAYS} jours de suivi individuel avec moi sur ton compte, sur candidature. L'Academy convient à la grande majorité des créateurs.`,
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
    answer: "Compte 3 à 5 heures par semaine pour créer et appliquer les recommandations. Analyser une vidéo prend quelques minutes, et tu reçois chaque jour une action concrète applicable le jour même.",
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

export const ROUTE_SEO: RouteSeo[] = [
  {
    path: "/",
    title: "Fred Wav — Expert Stratégie Formats Courts",
    description:
      "Tu plafonnes en vues ? J'analyse tes vraies stats pour te montrer pourquoi — et comment en sortir. Rejoins la Wav Academy et arrête de poster à l'aveugle.",
    keywords:
      "stratégie formats courts, accompagnement créateur de contenu, coach réseaux sociaux formats courts, Fred Wav, plafond de vues",
    noscript: {
      h1: "Arrête de poster à l'aveugle. Tes stats disent déjà pourquoi tu plafonnes en vues.",
      body: "Pas d'astuces d'algorithme, pas de promesses. J'analyse tes vraies données pour te montrer ce qui bloque ta visibilité — et on corrige, preuves à l'appui. Trois façons de travailler ensemble : la Wav Academy (l'offre principale), l'Analyse Express et le Wav Premium.",
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
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Wav Academy", item: `${BASE_URL}/wavacademy` },
          { "@type": "ListItem", position: 3, name: "Témoignages", item: `${BASE_URL}/preuves` },
        ],
      },
    ],
    sitemap: 1.0,
    llms: "Landing principale : la Wav Academy, l'Analyse Express et le Wav Premium, avec témoignages et preuves.",
    llmsSection: "principales",
  },
  {
    path: "/wavacademy",
    title: "Wav Academy — Diagnostique chaque vidéo, casse ton plafond de vues | Fred Wav",
    description: `Apprends à lire tes stats et à corriger tes vidéos, sans rester seul. Outil de diagnostic, contenu stratégique quotidien, live hebdo et communauté. Accès ${ACADEMY_PLANS.map((p) => p.duration).join(", ")} — dès ${ACADEMY_FROM} €, paiement unique.`,
    keywords:
      "wav academy, formation tiktok, diagnostic tiktok, wavsocialscan, contenu stratégique, formats courts, communauté créateurs",
    noscript: {
      h1: "Wav Academy — diagnostique chaque vidéo, corrige en temps réel, casse ton plafond de vues",
      body: `Un outil qui analyse tes vidéos et te dit quoi corriger, du contenu stratégique chaque jour, un live hebdomadaire avec Fred et un Discord premium. Trois Pass prépayés : ${academyPricing}. Paiement unique, sans abonnement ni reconduction.`,
      links: [{ href: "/wavacademy", label: "Voir les formules Wav Academy" }],
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "Wav Academy",
      description:
        "Programme de diagnostic continu pour créateurs : analyse data de chaque vidéo, contenu stratégique quotidien, lives hebdomadaires et communauté privée.",
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
    sitemap: 0.9,
    llms: `Programme de diagnostic continu pour créateurs (outil d'analyse vidéo, contenu stratégique quotidien, Discord et live hebdo). Trois Pass prépayés, paiement unique sans abonnement : ${academyPricing}.`,
    llmsSection: "offres",
  },
  {
    path: "/analyse-express",
    title: "Analyse Express — audit TikTok automatisé de ton compte | Fred Wav",
    description: `Audit TikTok automatisé : health score, métriques, persona et plan d'action. Rapport PDF téléchargeable pour ${EXPRESS_PRICE.toFixed(2).replace(".", ",")} €. TikTok uniquement.`,
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
    title: "Wav Premium — Candidature à l'accompagnement 30 jours | Fred Wav",
    description: `Premier contact avec Fred Wav : remplis le formulaire de qualification pour l'accompagnement individuel Wav Premium (${PREMIUM_DURATION_DAYS} jours). Réponse écrite avant tout appel.`,
    keywords:
      "wav premium, réserver un appel, candidature accompagnement, contact fred wav, coaching formats courts",
    noscript: {
      h1: `Wav Premium — ${PREMIUM_DURATION_DAYS} jours d'accompagnement individuel`,
      body: "Un accompagnement intensif et individuel : analyse complète de ton compte, un point stratégique chaque semaine, correction de tes scripts et des objectifs chiffrés. L'accès se fait sur candidature, après un échange écrit.",
      links: [{ href: "/reserverunappel", label: "Candidater au Wav Premium" }],
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `Wav Premium — accompagnement ${PREMIUM_DURATION_DAYS} jours`,
      description: `${PREMIUM_DURATION_DAYS} jours d'accompagnement individuel et intensif pour casser ton plafond de vues, sur candidature.`,
      provider: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
      areaServed: "FR",
      url: `${BASE_URL}/reserverunappel`,
    },
    sitemap: 0.8,
    llms: `Accompagnement individuel Wav Premium sur ${PREMIUM_DURATION_DAYS} jours, accessible sur candidature via un formulaire de qualification.`,
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
    title: "Guide gratuit : 120+ hooks TikTok classés par objectif | Fred Wav",
    description:
      "Télécharge gratuitement le guide des 120+ hooks TikTok qui captent l'attention en moins de 2 secondes. Testés sur des millions de vues.",
    keywords: "guide hooks tiktok, hooks gratuits, accroches tiktok, rétention tiktok, Fred Wav",
    noscript: {
      h1: "Reçois le guide des hooks gratuitement",
      body: "120+ hooks testés sur des millions de vues, les structures qui captent l'attention en moins de 2 secondes et les erreurs qui tuent ta rétention.",
      links: [{ href: "/newsletter", label: "Recevoir le guide gratuit" }],
    },
    sitemap: 0.5,
    llms: "Inscription à la newsletter et téléchargement du guide des 120+ hooks TikTok.",
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
export function seoFor(path: string): RouteSeo {
  const found = ROUTE_SEO.find((r) => r.path === path);
  if (!found) throw new Error(`[seo] Route inconnue : ${path}. Ajoute-la dans src/config/seo.ts.`);
  return found;
}
