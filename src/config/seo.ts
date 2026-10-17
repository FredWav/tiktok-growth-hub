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
  ACADEMY_GUIDES_COUNT,
  ACADEMY_LIVE_SLOT,
  ACADEMY_MODULES_COUNT,
  ACADEMY_SUPPORT_DAYS,
  EXPRESS_PRICE,
  OFFERS,
  VIDEO_ANALYSIS_PRICE,
  VIDEO_ANALYSIS_PRICE_LABEL,
  launchLabel,
  priceLabel,
  type Offer,
} from "./offers";
import { HOOKS_FAQ } from "./hooks-faq";
import { HOOKS_BUNDLE, HOOKS_LIBRARY, HOOKS_PACKS_OFFER } from "./hooks-offer";


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

const academy = OFFERS.academy;
const premium = OFFERS.premium;
const oneShot = OFFERS.one_shot;
const academyPrice = `${priceLabel(academy)} TTC, ${academy.priceNote} (${launchLabel(academy)})`;

/** Données structurées d'un accompagnement : un Service et son offre. */
function serviceSchema(offer: Offer, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: offer.name,
    serviceType: "Accompagnement en stratégie de contenu et réseaux sociaux",
    description,
    provider: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
    areaServed: "FR",
    url: `${BASE_URL}${offer.href}`,
    offers: {
      "@type": "Offer",
      price: offer.price.toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}${offer.href}`,
    },
  };
}

/**
 * FAQ éditoriale de la home, partagée avec l'accordéon visible.
 */
export const HOME_FAQ = [
  {
    question: "Est-ce que Fred travaille uniquement sur TikTok ?",
    answer: "Non. TikTok est une grosse partie de mon expertise et de mon contenu, mais les accompagnements portent sur ta stratégie réseaux dans son ensemble. Les accompagnements concernent TikTok, Instagram et YouTube. L'Analyse Express, en revanche, reste actuellement limitée à TikTok.",
  },
  {
    question: "Quelle différence entre la Wav Academy et le Wav Premium ?",
    answer: "La Wav Academy est un accompagnement collectif à vie : lives, Discord, cours et stratégie construite avec le groupe. Le Wav Premium est un suivi individuel d'au moins six semaines, avec des rendez-vous et WhatsApp. Pour un avis ponctuel, il y a le One Shot.",
  },
  {
    question: "La Wav Academy est-elle un abonnement ?",
    answer: `Non. Un seul paiement de ${priceLabel(academy)} TTC (${launchLabel(academy)?.toLowerCase()}) donne un accès à vie, tant que la Wav Academy existe.`,
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

/** Fil des pages d'offre : Accueil › offre. */
function offerBreadcrumb(path: string, name: string) {
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
    title: "Fred Wav : stratégie réseaux sociaux et contenus",
    description:
      "Comprends ce que racontent tes contenus et prends de meilleures décisions sur TikTok, Instagram et YouTube avec Fred Wav.",
    noscript: {
      h1: "Arrête de poster seul. Tes stats disent déjà ce qui bloque.",
      body: "Pas de hack ni de promesse de viralité. Fred Wav part de tes contenus, de tes statistiques, de ton positionnement et de tes objectifs pour travailler ta stratégie sur TikTok, Instagram et YouTube. Deux familles d'offres : des analyses TikTok automatisées (vidéo et compte) et des accompagnements avec Fred (One Shot, Wav Academy, Wav Premium) sur TikTok, Instagram et YouTube.",
      links: [
        { href: "/analyses", label: "Analyses TikTok : vidéo dès 2,90 €, compte à 19,90 €" },
        { href: "/accompagnements", label: "Accompagnements : One Shot, Wav Academy, Wav Premium" },
        { href: "/wavacademy", label: `Wav Academy : ${priceLabel(academy)} TTC, accès à vie` },
        { href: "/wav-premium", label: `Wav Premium : ${priceLabel(premium)} TTC pour six semaines` },
        { href: "/one-shot", label: `One Shot : audit et 1 h 30 avec Fred, ${priceLabel(oneShot)} TTC` },
        { href: "/temoignages", label: "Témoignages" },
        { href: "/a-propos", label: "À propos de Fred Wav" },
        { href: "/contact", label: "Contact" },
      ],
    },
    // Pas de fil d'Ariane sur l'accueil : c'est la racine. Le précédent
    // annonçait Accueil > Academy > Témoignages, un chemin de navigation
    // qui n'existe nulle part sur le site.
    // Identité de l'auteur sur la racine : seul noeud JSON-LD de l'accueil.
    schema: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Fred Wav",
      url: `${BASE_URL}/`,
      jobTitle: "Stratège contenu et réseaux sociaux",
      description:
        "Fred Wav accompagne les créateurs et entrepreneurs sur leur stratégie de contenu et de réseaux sociaux, à partir de leurs statistiques réelles.",
      sameAs: [
        "https://www.tiktok.com/@fredwav",
        "https://www.instagram.com/levraifredwav/",
        "https://www.youtube.com/@Fredwavconseils",
      ],
    },
    sitemap: 1.0,
    llms: "Stratégie de contenu et réseaux sociaux avec Fred Wav : analyses TikTok automatisées (vidéo, compte) et accompagnements (One Shot, Wav Academy à vie, Wav Premium individuel) sur TikTok, Instagram et YouTube.",
    llmsSection: "principales",
  },
  {
    path: "/wavacademy",
    title: "Wav Academy : accompagnement collectif à vie | Fred Wav",
    description: `Accompagnement collectif à vie sur TikTok, Instagram et YouTube : Discord en semaine, deux lives par semaine, tous les cours. ${priceLabel(academy)} TTC en paiement unique.`,
    noscript: {
      h1: "Progresse dans la durée, avec un cadre et un groupe, sans y passer ta vie",
      body: `Accompagnement collectif à vie, tant que la Wav Academy existe : deux lives par semaine ${ACADEMY_LIVE_SLOT}, Discord ${ACADEMY_SUPPORT_DAYS}, ${ACADEMY_MODULES_COUNT} modules, ${ACADEMY_GUIDES_COUNT} guides et une stratégie construite avec le collectif. ${academyPrice}. ${academy.capacityPerMonth} nouveaux membres par mois. Sans garantie de vues ou de revenus.`,
      links: [{ href: "/wavacademy", label: "Voir la Wav Academy" }, { href: "/accompagnements", label: "Comparer les accompagnements" }],
    },
    schema: [
      serviceSchema(academy, "Accompagnement collectif à vie sur TikTok, Instagram et YouTube : deux lives par semaine, Discord en semaine, cours et ressources, stratégie construite dans le temps."),
      offerBreadcrumb("/wavacademy", "Wav Academy"),
    ],
    sitemap: 0.9,
    llms: `Accompagnement collectif à vie (Wav Academy) : deux lives par semaine, Discord en semaine, ${ACADEMY_MODULES_COUNT} modules, ${ACADEMY_GUIDES_COUNT} guides, stratégie construite avec le collectif. ${academyPrice}. Pas d'individuel, pas de crédits WavStats, pas de garantie de résultat.`,
    llmsSection: "offres",
  },
  {
    path: "/analyse-express",
    title: "Analyse Express : audit de compte TikTok en 5 min | Fred Wav",
    description: `Audit automatisé de ton compte TikTok : jusqu’à 120 vidéos publiques comparées, points faibles, hypothèses et tests à lancer. Rapport PDF à ${EXPRESS_PRICE.toFixed(2).replace(".", ",")} €.`,
    noscript: {
      h1: "Tes statistiques TikTok sont visibles : que dois-tu tester ensuite ?",
      body: "Analyse automatisée des données publiques de ton profil et de tes vidéos disponibles, jusqu’à 120, sur un même échantillon documenté. Le rapport distingue les observations des hypothèses, ne remplace ni les statistiques privées de TikTok ni une analyse humaine et ne garantit aucune vue ou vente. En moins de 3 minutes dans ta boîte mail en fonctionnement normal après paiement, rapport PDF pour 19,90 € TTC.",
      sections: [
        { h2: "Qu’est-ce que l’Analyse Express ?", body: "Un audit de compte TikTok automatisé : tu indiques ton @, l’outil compare tes vidéos publiques (vues, engagement, régularité, formats) et identifie ce qui performe, ce qui décroche et quoi tester ensuite." },
        { h2: "Ce que contient le rapport", body: "Score de santé du compte, comparaison des vidéos, observations chiffrées, hypothèses et pistes de test prioritaires, au format PDF téléchargeable et envoyé par e-mail." },
        { h2: "Pour qui ?", body: "Créateurs, entrepreneurs et indépendants qui publient sur TikTok et veulent un diagnostic rapide et objectif de leur compte, sans abonnement ni rendez-vous." },
        { h2: "Prix et délai", body: "19,90 € TTC, paiement unique. Rapport reçu dans ta boîte mail en moins de 3 minutes après paiement. Pour une seule vidéo, voir l’Analyse Vidéo TikTok." },
      ],
      links: [
        { href: "/analyse-express", label: "Lancer mon Analyse Express" },
        { href: "/analyse-video", label: "Analyser une seule vidéo TikTok" },
      ],
    },
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Analyse Express - audit de compte TikTok",
        description:
          "Audit automatisé d’un compte TikTok à partir des données publiques : jusqu’à 120 vidéos comparées, score, observations, hypothèses, pistes de test et rapport PDF.",
        image: OG_IMAGE,
        category: "Audit de compte TikTok",
        brand: { "@type": "Brand", name: "Fred Wav" },
        url: `${BASE_URL}/analyse-express`,
        offers: {
          "@type": "Offer",
          price: EXPRESS_PRICE.toFixed(2),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${BASE_URL}/analyse-express`,
          seller: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
        },
      },
      offerBreadcrumb("/analyse-express", "Analyse Express"),
    ],
    sitemap: 0.9,
    llms: "Audit automatisé de compte TikTok à 19,90 € (Analyse Express) : jusqu’à 120 vidéos publiques comparées, score de santé, observations distinctes des hypothèses et pistes de test, rapport PDF reçu dans ta boîte mail en moins de 3 minutes. Ne remplace ni les statistiques privées de TikTok ni un audit humain ; aucune garantie de résultat.",
    llmsSection: "offres",
  },
  {
    path: "/analyse-video",
    title: "Analyse vidéo TikTok : hook, structure, CTA | Fred Wav",
    description: `Envoie le lien d’une vidéo TikTok : analyse de l’accroche, de la structure, du message et du CTA, plan d’action et rapport PDF par e-mail. ${VIDEO_ANALYSIS_PRICE_LABEL}, sans abonnement.`,
    noscript: {
      h1: "Envoie ta vidéo TikTok. On te dit ce qui fonctionne, ce qui bloque et quoi changer.",
      body: `Analyse automatisée d’une vidéo TikTok publique : accroche, structure, message et recommandations prioritaires. Rapport livré par e-mail avec un PDF téléchargeable, ${VIDEO_ANALYSIS_PRICE_LABEL} TTC, sans compte ni abonnement. Aucune garantie de vues.`,
      sections: [
        { h2: "Comment analyser une vidéo TikTok ?", body: "Colle le lien public de ta vidéo, paie, et l’analyse démarre automatiquement. Le rapport arrive par e-mail en quelques minutes." },
        { h2: "Ce qui est analysé", body: "Le hook des premières secondes, la structure du script, la clarté du message, le rythme, l’appel à l’action et les performances publiques de la vidéo, avec un score global." },
        { h2: "Ce que tu reçois", body: "Ce qui fonctionne, ce qui bloque et un plan d’action priorisé pour ta prochaine vidéo, en ligne et en PDF." },
        { h2: "Vidéo ou compte complet ?", body: "L’Analyse Vidéo porte sur une seule vidéo. Pour auditer tout ton compte TikTok, choisis l’Analyse Express." },
      ],
      links: [
        { href: "/analyse-video", label: "Analyser ma vidéo TikTok" },
        { href: "/analyse-express", label: "Auditer tout mon compte TikTok" },
      ],
    },
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Analyse Vidéo TikTok",
        description: "Analyse automatisée d’une vidéo TikTok publique : hook, structure, message, CTA, score et plan d’action, rapport PDF envoyé par e-mail.",
        image: OG_IMAGE,
        category: "Analyse de vidéo TikTok",
        brand: { "@type": "Brand", name: "Fred Wav" },
        url: `${BASE_URL}/analyse-video`,
        offers: {
          "@type": "Offer",
          price: VIDEO_ANALYSIS_PRICE.toFixed(2),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${BASE_URL}/analyse-video`,
          seller: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
        },
      },
      offerBreadcrumb("/analyse-video", "Analyse Vidéo TikTok"),
    ],
    sitemap: 0.9,
    llms: `Analyse automatisée d’une seule vidéo TikTok publique à ${VIDEO_ANALYSIS_PRICE_LABEL} : hook, structure, message, CTA, score et plan d’action, rapport PDF envoyé par e-mail en quelques minutes. Aucune garantie de résultat.`,
    llmsSection: "offres",
  },
  {
    path: "/wav-premium",
    title: "Wav Premium : accompagnement individuel avec Fred | Fred Wav",
    description: `Accompagnement individuel d'au moins six semaines : rendez-vous tous les quinze jours, suivi WhatsApp et retours sur tes contenus au jour le jour. ${priceLabel(premium)} TTC.`,
    noscript: {
      h1: "Ton expertise est solide : tes contenus doivent enfin la rendre visible",
      body: `Accompagnement individuel avec Fred, six semaines minimum (12 ou 18 sur devis) : un rendez-vous de 1 h 30 puis un rendez-vous d'une heure tous les quinze jours, suivi WhatsApp du lundi au vendredi avec réponse sous un jour ouvré, analyse des contenus à la demande. ${priceLabel(premium)} TTC pour six semaines. ${premium.capacityPerMonth} démarrages par mois, sur demande étudiée par Fred.`,
      links: [{ href: "/candidature?offre=premium", label: "Demander mon accompagnement" }, { href: "/accompagnements", label: "Comparer les accompagnements" }],
    },
    schema: [
      serviceSchema(premium, "Accompagnement individuel d'au moins six semaines en stratégie de contenu sur TikTok, Instagram et YouTube : rendez-vous réguliers, suivi WhatsApp, analyse des contenus."),
      offerBreadcrumb("/wav-premium", "Wav Premium"),
    ],
    sitemap: 0.9,
    llms: `Accompagnement individuel (Wav Premium) d'au moins six semaines, dès ${priceLabel(premium)} TTC : rendez-vous tous les quinze jours, WhatsApp en semaine, retours sur les contenus. Sur demande, sans garantie de résultat.`,
    llmsSection: "offres",
  },
  {
    path: "/one-shot",
    title: "One Shot : audit de compte et 1 h 30 avec Fred | Fred Wav",
    description: `Fred audite ton compte TikTok, Instagram ou YouTube, puis 1 h 30 de rendez-vous pour fixer la ligne à suivre. Résumé écrit fourni. ${priceLabel(oneShot)} TTC.`,
    noscript: {
      h1: "Un regard expert sur ton compte, et une ligne claire à suivre",
      body: `Audit complet du compte par Fred, puis 1 h 30 de rendez-vous pour corriger les problèmes et répondre à toutes les questions. Résumé écrit envoyé dans l'heure, ressources selon les besoins. ${priceLabel(oneShot)} TTC, ${oneShot.capacityPerMonth} places par mois, sur demande.`,
      links: [{ href: "/candidature?offre=one_shot", label: "Demander mon One Shot" }, { href: "/accompagnements", label: "Comparer les accompagnements" }],
    },
    schema: [
      serviceSchema(oneShot, "Audit de compte réseaux sociaux par Fred Wav suivi d'un rendez-vous de 1 h 30, avec résumé écrit et ressources."),
      offerBreadcrumb("/one-shot", "One Shot"),
    ],
    sitemap: 0.9,
    llms: `Audit de compte par Fred Wav et rendez-vous de 1 h 30 (One Shot), ${priceLabel(oneShot)} TTC : ligne à suivre, corrections, questions, résumé écrit. TikTok, Instagram et YouTube, sur demande.`,
    llmsSection: "offres",
  },
  {
    path: "/accompagnements",
    title: "Accompagnements réseaux sociaux avec Fred Wav : prix et formules",
    description: `One Shot (${priceLabel(oneShot)}), Wav Academy à vie (${priceLabel(academy)}) ou Wav Premium individuel (${priceLabel(premium)}) : compare les trois façons de travailler avec Fred.`,
    noscript: {
      h1: "Travailler avec Fred : trois façons, selon ton besoin",
      body: `One Shot : audit et 1 h 30 avec Fred, ${priceLabel(oneShot)} TTC. Wav Academy : accompagnement collectif à vie, ${academyPrice}. Wav Premium : accompagnement individuel dès ${priceLabel(premium)} TTC pour six semaines. TikTok, Instagram et YouTube.`,
      links: [
        { href: "/one-shot", label: "One Shot" },
        { href: "/wavacademy", label: "Wav Academy" },
        { href: "/wav-premium", label: "Wav Premium" },
      ],
    },
    schema: offerBreadcrumb("/accompagnements", "Accompagnements"),
    sitemap: 0.9,
    llms: "Comparatif des accompagnements de Fred Wav : One Shot (audit ponctuel), Wav Academy (collectif à vie) et Wav Premium (individuel), avec prix, format et suivi.",
    llmsSection: "offres",
  },
  {
    path: "/analyses",
    title: "Analyses TikTok automatisées : vidéo et compte | Fred Wav",
    description: `Analyse d'une vidéo TikTok à ${VIDEO_ANALYSIS_PRICE_LABEL} ou de tout ton compte à ${OFFERS.analyse_express.price.toFixed(2).replace(".", ",")} € : rapport en quelques minutes, sans abonnement.`,
    noscript: {
      h1: "Comprends ce qui bloque, vidéo par vidéo ou sur tout ton compte",
      body: `Deux analyses TikTok automatisées, livrées en quelques minutes par e-mail avec un PDF. Analyse vidéo : ${VIDEO_ANALYSIS_PRICE_LABEL} (${launchLabel(OFFERS.analyse_video)?.toLowerCase()}). Analyse Express du compte : 19,90 €. Sans abonnement.`,
      links: [
        { href: "/analyse-video", label: "Analyser une vidéo TikTok" },
        { href: "/analyse-express", label: "Analyser mon compte TikTok" },
      ],
    },
    schema: offerBreadcrumb("/analyses", "Analyses"),
    sitemap: 0.9,
    llms: "Comparatif des deux analyses TikTok automatisées de Fred Wav : Analyse vidéo (une vidéo) et Analyse Express (le compte), prix et délais.",
    llmsSection: "offres",
  },
  {
    path: "/temoignages",
    title: "Témoignages et résultats clients | Fred Wav",
    description:
      "Découvre des résultats clients contextualisés, des témoignages vidéo et des retours directs après accompagnement avec Fred Wav.",
    noscript: {
      h1: "Des résultats, pas des promesses",
      body: "Ce qui s'est réellement passé chez des créateurs accompagnés : résultats contextualisés, témoignages vidéo et captures de retours. Aucun résultat n'est présenté comme une garantie.",
      links: [{ href: "/temoignages", label: "Voir tous les témoignages" }],
    },
    sitemap: 0.7,
    llms: "Résultats clients contextualisés, témoignages vidéo et captures de retours, sans garantie ni cas générique inventé.",
    llmsSection: "principales",
  },
  {
    path: "/hooks-tiktok",
    title: `Hooks TikTok : ${HOOKS_LIBRARY.total} hooks qui ont vraiment performé | Fred Wav`,
    description: `${HOOKS_LIBRARY.total} hooks tirés de vraies vidéos TikTok : au moins 100 000 vues et au moins 5 fois les vues habituelles du compte. Chaque hook avec sa structure réutilisable. Packs dès ${HOOKS_PACKS_OFFER[0].price} €.`,
    noscript: {
      h1: "Des hooks TikTok qui ont vraiment performé. Pas des hooks inventés.",
      body: `Des accroches réelles, tirées de vidéos TikTok qui ont explosé les vues habituelles de leur compte, avec leur structure réutilisable. ${HOOKS_LIBRARY.total} hooks sélectionnés parmi ${HOOKS_LIBRARY.analyzedVideos} de vidéos analysées : au moins 100 000 vues et au moins 5 fois les vues habituelles du compte, relus un par un. 0 hook inventé.`,
      sections: [
        { h2: "Ce que tu reçois, pour chaque hook", body: "Le hook, sa structure à trous, les vues, la performance par rapport au compte, le taux d'engagement et le lien vers la vidéo d'origine." },
        { h2: "3 packs. 0 hook en commun.", body: HOOKS_PACKS_OFFER.map((p) => `${p.name} : ${p.price} €, ${p.medianViews} vues médianes, ${p.medianMultiple} les vues habituelles du compte en médiane.`).join(" ") + ` La bibliothèque complète, ${HOOKS_BUNDLE.hooks} hooks : ${HOOKS_BUNDLE.price} €.` },
        { h2: "Questions fréquentes", body: HOOKS_FAQ.map((f) => f.question).join(" ") },
      ],
      links: [
        { href: "/hooks-tiktok#packs", label: "Voir les packs de hooks" },
        { href: "/newsletter", label: "Recevoir le guide gratuit des hooks" },
      ],
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Bibliothèque de hooks TikTok",
      description: `${HOOKS_LIBRARY.total} hooks tirés de vraies vidéos TikTok, avec leur structure réutilisable, les vues et le lien vers la vidéo d'origine. PDF et fichier tableur.`,
      image: OG_IMAGE,
      brand: { "@type": "Person", name: "Fred Wav", url: BASE_URL },
      offers: [...HOOKS_PACKS_OFFER.map((p) => ({ name: p.name, price: p.price })), { name: "Bibliothèque complète", price: HOOKS_BUNDLE.price }]
        .map((o) => ({
          "@type": "Offer",
          name: o.name,
          price: o.price.toFixed(2),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${BASE_URL}/hooks-tiktok`,
        })),
    },
    sitemap: 0.8,
    llms: `Bibliothèque de ${HOOKS_LIBRARY.total} hooks TikTok réels, tirés de vidéos d'au moins 100 000 vues et au moins 5 fois les vues habituelles du compte, avec structure réutilisable et lien vers chaque vidéo. Packs de 100, 250 et 500 hooks sans doublon (${HOOKS_PACKS_OFFER.map((p) => `${p.price} €`).join(", ")}) ou bibliothèque complète à ${HOOKS_BUNDLE.price} €. PDF et tableur envoyés par email. Aucune garantie de vues.`,
    llmsSection: "offres",
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
    title: "Fred Wav : consultant en stratégie réseaux sociaux",
    description:
      "Découvre le parcours et la méthode de Fred Wav, créateur, formateur et consultant en stratégie sur TikTok, Instagram et YouTube.",
    noscript: {
      h1: "Je ne t'aide pas à poster plus. Je t'aide à comprendre quoi faire ensuite.",
      body: "Fred Wav est créateur de contenu, formateur et consultant en stratégie réseaux sociaux. Son expertise historique vient de TikTok et des formats courts, mais ses accompagnements peuvent aussi intégrer Instagram, YouTube, Facebook et les stratégies multiréseaux. Son approche repose sur le contexte, les contenus, les statistiques, le positionnement et les objectifs réels.",
      links: [{ href: "/temoignages", label: "Voir les témoignages" }],
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
    title: "La newsletter de Fred Wav : un mail, du concret",
    description:
      "Reçois mes conseils formats courts par email, et le guide complet des hooks TikTok en cadeau de bienvenue. Sans spam, désinscription en un clic.",
    noscript: {
      h1: "La newsletter de Fred Wav",
      body: "Mes conseils formats courts par email, et le guide complet des hooks TikTok pour commencer. La bibliothèque de hooks TikTok est sur /hooks-tiktok.",
      links: [
        { href: "/hooks-tiktok", label: "Voir la bibliothèque de hooks TikTok" },
        { href: "/accompagnements", label: "Les accompagnements de Fred Wav" },
      ],
    },
    sitemap: 0.4,
    llms: "Inscription à la newsletter de Fred Wav ; le guide complet des hooks TikTok est offert à l'inscription.",
    llmsSection: "ressources",
  },
  {
    path: "/contact",
    title: "Contact : Fred Wav | Expert Formats Courts",
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
      "CGV applicables aux analyses, au One Shot, à la Wav Academy, au Wav Premium et aux packs de hooks proposés par Fred Wav.",
    noscript: {
      h1: "Conditions Générales de Vente",
      body: "Conditions applicables aux analyses vidéo et Express, au One Shot, à la Wav Academy, au Wav Premium et aux packs de hooks.",
    },
    sitemap: 0.2,
    llms: "CGV du site.",
    llmsSection: "legales",
  },
  {
    path: "/mentions-legales",
    title: "Mentions légales | Fred Wav",
    description:
      "Mentions légales du site fredwav.com : éditeur, hébergeur, propriété intellectuelle et données personnelles.",
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
      "Politique de confidentialité du site fredwav.com : collecte, utilisation et protection de tes données personnelles conformément au RGPD.",
    noscript: {
      h1: "Politique de confidentialité",
      body: "Comment les données personnelles sont collectées, utilisées et protégées, conformément au RGPD.",
    },
    sitemap: 0.2,
    llms: "Politique de gestion des données personnelles et cookies.",
    llmsSection: "legales",
  },
];

const ALLOWED_SCHEMA_TYPES = new Set(["Product", "Service", "Person", "Article", "BreadcrumbList"]);

function routeKind(path: string): Exclude<RouteKind, "redirect"> {
  if (["/analyses", "/accompagnements", "/one-shot", "/wavacademy", "/analyse-express", "/analyse-video", "/wav-premium"].includes(path)) return "commercial";
  if (["/cgv", "/mentions-legales", "/politique-de-confidentialite"].includes(path)) return "legal";
  return "content";
}

/** Un seul graphe route-scoped, composé uniquement des types autorisés. */
function buildRouteSchema(route: RouteSeo, indexable: boolean): Record<string, unknown> | undefined {
  if (!indexable) return undefined;

  const nodes = route.schema ? (Array.isArray(route.schema) ? [...route.schema] : [route.schema]) : [];
  if (route.path.startsWith("/ressources/")) {
    const name = route.title.split(/[:|]/)[0].trim();
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
  const indexable = true;
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
  { path: "/candidature", title: "Demande d’accompagnement | Fred Wav" },
  { path: "/inscription/:token", title: "Inscription personnelle | Fred Wav", private: true },
  { path: "/admin/commandes", title: "Commandes et demandes | Fred Wav", private: true, clientBoundary: "admin" },
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
  { path: "/analyse-video/merci", title: "Commande confirmée | Fred Wav" },
  { path: "/analyse-video/rapport", title: "Ton analyse vidéo | Fred Wav", private: true },
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
    "description" in route && typeof route.description === "string"
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
  ["/start", "/analyse-express", 308],
  ["/offres", "/accompagnements", 308],
  ["/preuves", "/temoignages", 308],
  ["/reserverunappel", "/candidature", 308],
  ["/wavacademy/appel", "/candidature?offre=academy", 308],
  ["/wav-premium/candidature", "/candidature?offre=premium", 308],
  ["/45-jours", "/accompagnements", 308],
  ["/offres/45-jours", "/accompagnements", 308],
  ["/offres/vip", "/wavacademy", 308],
  ["/accompagnement-reseaux-sociaux", "/accompagnements", 308],
  ["/accompagnement-tiktok", "/accompagnements", 308],
  ["/one-shot/success", "/", 307],
  ["/mail", "/newsletter", 308],
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
