/**
 * FAQ de la page /hooks-tiktok.
 *
 * Source unique partagée entre HooksTikTok.tsx (l'accordéon affiché) et
 * src/config/seo.ts (le JSON-LD FAQPage du prerender). Google sanctionne un
 * FAQPage dont les questions ne sont pas visibles sur la page : elles doivent
 * sortir d'ici, des deux côtés.
 *
 * Deux questions portent des requêtes que le positionnement du site conteste
 * (« plus de vues », « algorithme ») : elles répondent vraiment à l'intention
 * du chercheur, puis démontent la fausse promesse. Pur data, aucun import React.
 */

export const HOOKS_FAQ = [
  {
    question: "C'est quoi un hook sur TikTok ?",
    answer:
      "Un hook, ou accroche, ce sont les premières secondes de ta vidéo, celles qui décident si le spectateur reste ou scrolle. Sur TikTok, tu as à peu près deux secondes pour lui donner une raison de ne pas passer à la suivante. Le hook, c'est cette raison.",
  },
  {
    question: "Combien de temps dure un bon hook TikTok ?",
    answer:
      "Deux à trois secondes. C'est la fenêtre pendant laquelle le spectateur décide. Un hook qui met dix secondes à démarrer n'est plus un hook : la décision est déjà prise, et elle est rarement en ta faveur.",
  },
  {
    question: "Est-ce que copier un hook TikTok suffit à faire des vues ?",
    answer:
      "Non. Un hook fait gagner l'attention des deux premières secondes, pas la diffusion de la vidéo. Copier une accroche sans que le reste tienne, c'est retenir quelqu'un une seconde de plus pour le décevoir juste après. Le hook ouvre la porte ; ce qu'il y a derrière décide si on entre.",
  },
  {
    question: "Un bon hook, ça plaît à l'algorithme TikTok ?",
    answer:
      "La question est mal posée. Un hook n'agit pas sur une machine, il agit sur des humains : il fait qu'ils regardent au lieu de scroller. Personne ne contrôle l'algorithme, et ceux qui te vendent des « astuces pour lui plaire » te vendent du vent. Ce que tu contrôles, c'est ta rétention sur les trois premières secondes. Ça, c'est dans tes stats, et ça se travaille.",
  },
  {
    question: "Comment savoir si mon hook TikTok est bon ?",
    answer:
      "Regarde ta courbe de rétention. Si tu perds une grosse part de ton audience avant la troisième seconde, le problème est presque toujours le hook. Change-le sur ta prochaine vidéo, tout le reste identique, et compare. C'est le seul test qui vaille : tes propres chiffres, pas une règle générale.",
  },
  {
    question: "Est-ce que ces hooks marchent aussi sur Reels et Shorts ?",
    answer:
      "Oui. La logique est la même sur Instagram Reels et YouTube Shorts : les premières secondes décident. Les formulations changent à la marge selon l'audience de chaque plateforme, mais un hook qui retient sur TikTok retient ailleurs.",
  },
  {
    question: "Faut-il un hook différent selon la niche ?",
    answer:
      "Le mécanisme est universel, le ton non. Une accroche qui fonctionne en divertissement peut sonner faux en B2B, et l'inverse. Pars des familles ci-dessus, garde celles qui collent à ta façon de parler, et laisse tomber celles qui te feraient jouer un personnage.",
  },
  {
    question: "Où télécharger le guide complet des hooks TikTok ?",
    answer:
      "Le guide complet regroupe toutes les accroches classées, les modèles à compléter avec ton propre sujet, et une grille pour noter la force d'un hook avant de tourner. Tu le reçois par email depuis cette page, gratuitement.",
  },
];
