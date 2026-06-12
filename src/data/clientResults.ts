// ── Résultats clients documentés ───────────────────────────────────────────
// Cas réels fournis par Fred / publics sur les comptes. AUCUN chiffre inventé.
// L'avatar est tiré de `trusted_clients` (par `avatarName` si différent de `name`).
// Pour ajouter un cas : copie un bloc et remplis-le avec un chiffre réel.
export type ClientResult = {
  name: string;
  avatarName?: string; // nom exact dans trusted_clients si différent de `name`
  avatarUrl?: string; // photo locale (ex. "/plotbreaker.jpg") si le client n'est pas dans trusted_clients
  niche?: string;
  metric: string; // accroche chiffrée : "×3", "1,3 M", "+3 000"…
  result: string; // description du résultat
  detail?: string; // précision optionnelle (multi-réseaux, durée…)
};

export const CLIENT_RESULTS: ClientResult[] = [
  {
    name: "PlotBreaker",
    // PlotBreaker n'est pas dans trusted_clients → photo locale. Fred : dépose le fichier
    // dans public/plotbreaker.jpg (ou ajoute "PlotBreaker" dans les Clients de confiance en admin).
    avatarUrl: "/plotbreaker.jpg",
    niche: "Analyse films & séries",
    metric: "+3 000",
    result: "abonnés en moins d'un mois",
    detail: "cap des 10 000 franchi",
  },
  {
    name: "Antoine au Vietnam",
    avatarName: "Antoine Au Vietnam",
    niche: "Expatriation · Vietnam",
    metric: "1,3 M",
    result: "de vues sur sa meilleure vidéo",
  },
  {
    name: "Lucille",
    niche: "Films d'horreur",
    metric: "×16",
    result: "de 180 à 3 000+ abonnés",
    detail: "en 2 mois, sur une niche pointue",
  },
  {
    name: "David",
    avatarName: "David Agaesse",
    niche: "Élevage canin · épagneul breton",
    metric: "×4",
    result: "abonnés qualifiés en 1 mois",
    detail: "portée ×2, surtout sur Facebook",
  },
  {
    name: "Le Sapac",
    niche: "Streaming · jeux vidéo (WoW)",
    metric: "10–20k",
    result: "vues régulières par vidéo",
    detail: "+ des revenus Twitch en hausse",
  },
  {
    name: "Alex Brosse",
    metric: "×3",
    result: "abonnés triplés",
    // niche/detail : à compléter par Fred si besoin
  },
];
