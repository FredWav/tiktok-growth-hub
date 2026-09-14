export type OrientationOffer = "express" | "one_shot" | "academy" | "premium";

export type OrientationResult = {
  route: "express" | "call";
  offer: OrientationOffer;
  score: number;
};

export function qualifyOrientation(
  budget: string,
  workMode: string,
): OrientationResult {
  // Règle commerciale ferme : aucun appel de vente sous 399 EUR.
  if (budget === "under_399") {
    return { route: "express", offer: "express", score: 0 };
  }
  if (budget === "399_748") {
    return { route: "call", offer: "one_shot", score: 3 };
  }
  if (budget === "749_1989") {
    return workMode === "plan_ponctuel"
      ? { route: "call", offer: "one_shot", score: 5 }
      : { route: "call", offer: "academy", score: 6 };
  }
  if (workMode === "suivi_collectif") {
    return { route: "call", offer: "academy", score: 8 };
  }
  if (["outils_autonomes", "plan_ponctuel"].includes(workMode)) {
    return { route: "call", offer: "one_shot", score: 8 };
  }
  return { route: "call", offer: "premium", score: 9 };
}
