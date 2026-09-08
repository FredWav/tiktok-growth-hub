import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const page = (path) =>
  readFile(new URL(`../dist/${path}/index.html`, import.meta.url), "utf8");
test("Premium indexé, formulaires exclus du sitemap", async () => {
  const sitemap = await readFile(
    new URL("../dist/sitemap.xml", import.meta.url),
    "utf8",
  );
  assert.match(sitemap, /https:\/\/fredwav.com\/wav-premium</);
  assert.doesNotMatch(sitemap, /reserverunappel|wavacademy\/appel|inscription/);
  for (const path of ["reserverunappel", "wavacademy/appel"]) {
    assert.match(await page(path), /noindex/);
  }
});
test("gamme publique cohérente et aucune ancienne formule Academy", async () => {
  const academy = await page("wavacademy");
  assert.match(academy, /749/);
  assert.match(academy, /sans sacrifier ton expertise/);
  assert.match(academy, /TikTok et ChatGPT/);
  assert.match(academy, /Les vues ne sont pas l’objectif final/);
  assert.doesNotMatch(
    academy.replace(/<[^>]*>/g, " "),
    /\b(?:299|499|899)\s*€|trois formules|replays/,
  );
  const premium = await page("wav-premium");
  assert.match(premium, /1 990/);
  assert.match(premium, /WhatsApp/);
  assert.match(premium, /Je ne veux pas devenir un influenceur/);
  assert.match(premium, /Les vues ne paient pas mes factures/);
  assert.match(premium, /Pourquoi 1 990 €/);
  const express = await page("analyse-express");
  assert.match(express, /ni un ChatGPT avec un autre logo/);
  assert.match(express, /Les vues ne disent rien sur mon chiffre d’affaires/);
});
test("redirection HTML start conserve la campagne et le fragment", async () => {
  const start = await page("start");
  assert.match(start, /location.search/);
  assert.match(start, /location.hash/);
  assert.match(start, /analyse-express/);
});
