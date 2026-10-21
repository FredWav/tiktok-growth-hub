import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const page = (path) =>
  readFile(new URL(`../dist/${path}/index.html`, import.meta.url), "utf8");
test("pages d'offres indexées, formulaire de demande exclu du sitemap", async () => {
  const sitemap = await readFile(
    new URL("../dist/sitemap.xml", import.meta.url),
    "utf8",
  );
  for (const path of ["analyses", "accompagnements", "one-shot", "wavacademy", "wav-premium", "temoignages"]) {
    assert.match(sitemap, new RegExp(`https://fredwav.com/${path}<`));
  }
  assert.doesNotMatch(sitemap, /candidature|reserverunappel|wavacademy\/appel|inscription|preuves/);
  assert.match(await page("candidature"), /noindex/);
  for (const [from, to] of [["preuves", "/temoignages"], ["reserverunappel", "/candidature"], ["wavacademy/appel", "/candidature?offre=academy"]]) {
    assert.ok((await page(from)).includes(`url=${to}"`), `${from} doit rediriger vers ${to}`);
  }
});
test("gamme publique cohérente : prix du catalogue, lancement annoncé, aucune ancienne formule", async () => {
  const text = async (path) => (await page(path)).replace(/<[^>]*>/g, " ").replace(/&#x27;/g, "'");
  const academy = await text("wavacademy");
  assert.match(academy, /749 €/);
  assert.match(academy, /Prix de lancement jusqu'au 31\/12\/2026, puis 990 €/);
  assert.match(academy, /à vie/);
  assert.match(academy, /Pas de recette magique/);
  assert.doesNotMatch(academy, /(?:299|499|899)\s*€|six mois|crédits WavStats au démarrage/);
  const premium = await text("wav-premium");
  assert.match(premium, /Dès 1 499 €/);
  assert.match(premium, /WhatsApp/);
  assert.match(premium, /Je ne veux pas devenir un influenceur/);
  assert.match(premium, /Les vues ne paient pas mes factures/);
  const oneShot = await text("one-shot");
  assert.match(oneShot, /399 €/);
  assert.match(oneShot, /1 h 30/);
  const hub = await text("accompagnements");
  for (const price of ["399 €", "749 €", "Dès 1 499 €"]) assert.match(hub, new RegExp(price));
  for (const path of ["", "wavacademy", "wav-premium", "accompagnements", "temoignages"]) {
    assert.doesNotMatch(await text(path), /1 990|trente jours|30 jours/, path || "accueil");
  }
  const express = await page("analyse-express");
  assert.match(express, /Tes vraies vidéos, analysées en 3 minutes/);
  assert.match(express, /Les vues ne disent rien sur mon chiffre d’affaires/);
});
test("redirection HTML start conserve la campagne et le fragment", async () => {
  const start = await page("start");
  assert.match(start, /location.search/);
  assert.match(start, /location.hash/);
  assert.match(start, /analyse-express/);
});

test("une URL inconnue servie avec l'accueil passe en noindex", async () => {
  const home = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  const guard = home.match(/<script>\(function\(\)\{var p=location\.pathname[\s\S]*?<\/script>/)?.[0];
  assert.ok(guard, "garde-fou absent de l'accueil");
  const run = (pathname) => {
    const meta = { content: "index, follow", setAttribute(_, value) { this.content = value; } };
    const document = { querySelector: (selector) => selector.includes("robots") ? meta : null };
    new Function("location", "document", guard.replace(/^<script>|<\/script>$/g, ""))({ pathname }, document);
    return meta.content;
  };
  assert.equal(run("/"), "index, follow");
  assert.equal(run("/page-inexistante"), "noindex, nofollow");
});
