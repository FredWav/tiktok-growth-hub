/**
 * Contenu de la page /hooks-tiktok.
 *
 * Pur data : importé par src/config/seo.ts, lui-même importé par vite.config.ts
 * au BUILD (génération du prerender, du sitemap et de llms.txt). Aucun import
 * React, aucune API navigateur — même contrainte qu'offers.ts et wavacademy-faq.ts.
 *
 * Découpage assumé : `samples` = les accroches publiées en clair, indexables.
 * `totalInGuide` = le total réel de la famille dans le PDF complet, réservé à
 * l'email. Les compteurs affichés (titre, description, llms.txt) sont DÉRIVÉS
 * de ces tableaux : impossible d'annoncer un chiffre que la page ne tient pas.
 *
 * Chaque famille porte un `watchOut` — non optionnel. C'est ce qui distingue la
 * page des listes d'accroches concurrentes, et ce qui empêche de lire un exemple
 * comme une promesse de Fred : une accroche est une technique, pas un engagement.
 */

export type HookCategory = {
  /** Ancre de la page : #hooks-curiosite. */
  slug: string;
  /** h3 visible, porteur du mot-clé « hooks ». */
  label: string;
  /** À quoi sert la famille, quand l'employer. */
  intro: string;
  /** Le prix de la famille quand on en abuse. Jamais une promesse. */
  watchOut: string;
  /** Accroches publiées en clair. */
  samples: string[];
  /** Total de la famille dans le guide complet (samples inclus). */
  totalInGuide: number;
};

export const HOOK_CATEGORIES: HookCategory[] = [
  {
    slug: "suspense",
    label: "Hooks de suspense",
    intro:
      "Tu gardes l'information la plus forte pour plus tard. Le spectateur reste parce qu'il veut savoir comment ça se termine.",
    watchOut:
      "Le suspense se paie à la fin. Si la chute ne tient pas ce que l'ouverture a promis, il ne restera pas la prochaine fois, et ton prochain « attends la fin » ne marchera plus.",
    samples: ["Attends de voir la fin…", "Ce qui va se passer va te surprendre.", "Personne ne s'y attendait…"],
    totalInGuide: 10,
  },
  {
    slug: "curiosite",
    label: "Hooks de curiosité",
    intro:
      "Tu ouvres une question dans la tête du spectateur. Le cerveau supporte mal une boucle laissée ouverte : il reste pour la refermer.",
    watchOut:
      "La curiosité fait regarder, elle ne fidélise pas. Si le « secret » se révèle banal, tu as gagné une vue et entamé la confiance qui, elle, ramène.",
    samples: [
      "Il y a une vérité qu'on te cache depuis trop longtemps…",
      "J'ai découvert un truc qui va bouleverser ta vision des choses.",
      "Ce détail change tout.",
    ],
    totalInGuide: 10,
  },
  {
    slug: "surprise",
    label: "Hooks de surprise",
    intro: "Tu annonces d'emblée que ce qui suit sort de l'ordinaire. Le spectateur reste pour vérifier.",
    watchOut:
      "« Incroyable » et « fou » s'usent à la vitesse où tu les emploies. Garde-les pour ce qui l'est vraiment, sinon plus rien ne surprend.",
    samples: [
      "Tu ne vas pas croire ce qui vient d'arriver.",
      "Quelque chose d'inattendu s'est passé aujourd'hui.",
      "Ce que je vais te montrer sort de l'ordinaire.",
    ],
    totalInGuide: 10,
  },
  {
    slug: "urgence",
    label: "Hooks d'urgence",
    intro: "Tu donnes une raison de regarder tout de suite, plutôt que « plus tard », c'est-à-dire jamais.",
    watchOut:
      "L'urgence répétée sonne creux. Si chaque vidéo est « maintenant ou jamais », le spectateur apprend que ce n'est ni l'un ni l'autre.",
    samples: ["Ne perds pas une seconde de plus.", "Il ne te reste plus beaucoup de temps…", "C'est maintenant ou jamais."],
    totalInGuide: 15,
  },
  {
    slug: "chiffres",
    label: "Hooks chiffrés",
    intro: "Un chiffre accroche l'œil et pose une autorité en une seconde.",
    watchOut:
      "Un chiffre que tu ne peux pas justifier se retourne contre toi. Ne l'avance que si tu le tiens : inventer un pourcentage de résultat, sur un sujet commercial, c'est une pratique trompeuse, donc illégale.",
    samples: [
      "90 % des gens ignorent cette technique…",
      "L'erreur que la plupart font sans le savoir.",
      "Il y a une règle que presque personne n'applique.",
    ],
    totalInGuide: 5,
  },
  {
    slug: "rarete",
    label: "Hooks de rareté",
    intro: "Tu donnes le sentiment d'un accès que tout le monde n'a pas. Ce qui est rare paraît précieux.",
    watchOut:
      "La rareté n'est crédible que si le contenu est à la hauteur du « secret » annoncé. Promets un accès privilégié et sers du réchauffé : la déception, elle, se retient.",
    samples: [
      "Ce truc, peu de gens l'utilisent vraiment.",
      "Je vais te partager un truc que je garde d'habitude pour moi.",
      "Personne ne te dira ça, mais c'est essentiel.",
    ],
    totalInGuide: 5,
  },
  {
    slug: "resultat",
    label: "Hooks de résultat",
    intro: "Tu mets le bénéfice en avant dès la première seconde.",
    watchOut:
      "Montrer un résultat, oui. Le garantir, non : personne ne contrôle ce que TikTok fera de ta vidéo. Promettre un chiffre de vues ou de revenus, c'est précisément ce qui te met hors la loi.",
    samples: ["Les résultats parlent d'eux-mêmes…", "J'y croyais pas… jusqu'à ce que je teste.", "Teste ça, et regarde la différence."],
    totalInGuide: 5,
  },
  {
    slug: "emotion",
    label: "Hooks d'émotion",
    intro: "Tu touches une corde avant de dérouler ton propos. Une émotion retient plus longtemps qu'une information.",
    watchOut:
      "L'émotion se respecte. Annonce un bouleversement et livre une banalité : c'est toi qui passes pour celui qui en fait trop.",
    samples: [
      "Ce que je vais te dire va te toucher.",
      "Tu ne verras plus les choses pareil après ça.",
      "J'aurais aimé le savoir plus tôt…",
    ],
    totalInGuide: 5,
  },
  {
    slug: "simplicite",
    label: "Hooks de simplicité",
    intro: "Tu lèves l'objection « c'est trop compliqué pour moi » avant même qu'elle apparaisse.",
    watchOut:
      "Promettre « simple » puis noyer le spectateur, c'est le trahir dès la première seconde. Si tu dis facile, sois facile.",
    samples: [
      "Un conseil simple, mais que peu de gens appliquent.",
      "Il te suffit de deux minutes pour tester ça.",
      "Voici la façon la plus simple de t'y mettre.",
    ],
    totalInGuide: 5,
  },
  {
    slug: "provocateur",
    label: "Hooks provocateurs",
    intro: "Tu bouscules pour créer une réaction. Un spectateur qui n'est pas d'accord reste pour te contredire.",
    watchOut:
      "La provocation clive : elle gagne des défenseurs et des adversaires à parts égales. À doser. Si chaque vidéo cherche la bagarre, tu fatigues même ceux qui t'aiment bien.",
    samples: [
      "Tu peux continuer comme ça… ou essayer autre chose.",
      "Ça te paraît trop simple ? Teste avant de juger.",
      "Certains ne seront pas d'accord, tant pis.",
    ],
    totalInGuide: 5,
  },
];

/** Accroches à compléter (« _____ ») — réservées au guide complet, jamais publiées en clair. */
export const HOOK_TEMPLATES_TOTAL = 50;

/** Nombre d'accroches réellement affichées sur la page. */
export const HOOKS_PUBLISHED_COUNT = HOOK_CATEGORIES.reduce((n, c) => n + c.samples.length, 0);

/** Total du guide complet : les familles classées plus les accroches à compléter. */
export const HOOKS_TOTAL_COUNT =
  HOOK_CATEGORIES.reduce((n, c) => n + c.totalInGuide, 0) + HOOK_TEMPLATES_TOTAL;
