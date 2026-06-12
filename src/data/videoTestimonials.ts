// ── Fiches créateurs (témoignages vidéo) ───────────────────────────────────
// Une entrée par vidéo, clé = ID YouTube. Rempli au fur et à mesure par Fred.
// Une légende ne s'affiche QUE si `name` est renseigné — tant qu'une vidéo n'a
// pas de fiche ici, sa vignette reste sans légende (rien d'inventé n'est publié).
// `result` = chiffre réel/public fourni par Fred (vues, abonnés, engagement…).
export type VideoMeta = {
  name: string; // nom ou handle affiché (ex. "Antoine au Vietnam")
  niche?: string; // ex. "Expatriation au Vietnam"
  result?: string; // résultat chiffré réel, ex. "Vidéos jusqu'à 1,3 M de vues"
};

export const VIDEO_META: Record<string, VideoMeta> = {
  // Antoine au Vietnam — @antoineauvietnam (IG 10,4k) · vidéos 1,3 M / 607 k / 334 k vues
  p3nCwuBZRGI: {
    name: "Antoine au Vietnam",
    niche: "Expatriation · vie au Vietnam",
    result: "Vidéos jusqu'à 1,3 M de vues",
  },

  // Lucille — "Lune De Lù" @lunedelu (accompagnement 30 j) · niche film d'horreur
  Hgkn3ifjSS0: {
    name: "Lucille",
    niche: "Films d'horreur",
    result: "De 180 à 3 000+ abonnés en 2 mois",
  },

  // David — @fiefdeskallistos (accompagnement 30 j) · résultats surtout sur Facebook
  // (multi-réseaux) : portée ×2, +265,1 k vues, abonnés qualifiés ×4 sur le mois.
  LOi7RTx12nE: {
    name: "David",
    niche: "Élevage canin · épagneul breton",
    result: "Abonnés qualifiés ×4 en 1 mois",
  },

  // PlotBreaker — David, @plotbreakr (membre Wav Academy) · analyse films & séries
  // Courbe d'abonnés plate → croissante après les outils Academy : +3 126 nets (+762 %)
  // sur 60 j, cap des 10 000 abonnés franchi.
  XMMmmLLKue4: {
    name: "PlotBreaker",
    niche: "Analyse films & séries",
    result: "+3 000 abonnés en moins d'un mois",
  },

  // Jérôme "Le Sapac" — streamer/créateur jeux vidéo (accompagnement) · multi-réseaux :
  // son TikTok a aussi boosté son Twitch (revenus + visibilité). Résultats dès ~1 semaine.
  "wu2CPcqp-yU": {
    name: "Le Sapac",
    niche: "Streaming jeux vidéo (WoW)",
    result: "Vidéos régulières à 10–20 k vues",
  },

  // TODO Fred : ajouter les autres créateurs ici, même format.
  // "<ID_YOUTUBE>": { name: "…", niche: "…", result: "… (chiffre réel)" },
};
