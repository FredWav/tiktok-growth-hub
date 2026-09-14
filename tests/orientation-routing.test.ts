import { qualifyOrientation } from "../supabase/functions/_shared/orientation.ts";

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Attendu ${JSON.stringify(expected)}, reçu ${JSON.stringify(actual)}`,
    );
  }
}

Deno.test("un budget inférieur à 399 EUR est toujours orienté vers l'Analyse Express", () => {
  for (
    const mode of [
      "outils_autonomes",
      "plan_ponctuel",
      "suivi_collectif",
      "suivi_individuel",
      "a_definir",
    ]
  ) {
    equal(qualifyOrientation("under_399", mode), {
      route: "express",
      offer: "express",
      score: 0,
    });
  }
});

Deno.test("les paliers supérieurs couvrent les offres humaines", () => {
  equal(qualifyOrientation("399_748", "suivi_individuel"), {
    route: "call",
    offer: "one_shot",
    score: 3,
  });
  equal(qualifyOrientation("749_1989", "suivi_collectif"), {
    route: "call",
    offer: "academy",
    score: 6,
  });
  equal(qualifyOrientation("1990_plus", "suivi_individuel"), {
    route: "call",
    offer: "premium",
    score: 9,
  });
});
