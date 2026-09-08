const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { normalizeExpressSample } from "../supabase/functions/_shared/express-sample.ts";

// All off-origin requests are intercepted. Never submits test data to production.
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const output = new URL("../tmp/commerce-qa/", import.meta.url).pathname.replace(
  /^\/(\w:)/,
  "$1",
);
await mkdir(output, { recursive: true });
let applications = 0;
const errors = [];
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(e.message));
const videos = Array.from({ length: 120 }, (_, i) => ({
  id: String(i + 1),
  date: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
  description: `Vidéo test ${i + 1} : création, stratégie, régularité.`,
  views: 100 + i,
  likes: 10,
  comments: 2,
  shares: 1,
  saves: 1,
}));
const ids = videos.map((v) => v.id);
const report = normalizeExpressSample({
  account: {
    username: "test",
    followers: 1500,
    totalVideos: 300,
    totalLikes: 15000,
  },
  videos,
  aiAnalysis: {
    summary:
      "Observations : les vidéos de cet échantillon reçoivent des interactions. Hypothèse : préciser le sujet pourrait aider. À tester, sans garantie de résultat.",
    strengths: [{
      title: "Un sujet lisible",
      description: "Observation limitée aux contenus étudiés.",
    }],
    improvements: [{
      title: "Clarifier la promesse",
      description: "Hypothèse éditoriale à tester.",
    }],
    actionPlan: [{
      text: "Tester une accroche plus précise pendant une semaine.",
      metric: "Comparer les résultats, sans objectif garanti.",
    }],
  },
  analysisScope: { videoIds: ids, sections: { aiAnalysis: ids } },
});
await ctx.route("**/*", async (route) => {
  const url = new URL(route.request().url());
  if (url.hostname === "127.0.0.1") return route.continue();
  const path = url.pathname;
  if (path.includes("submit-academy-application")) {
    applications++;
    return route.fulfill({
      json: {
        id: "fake-request",
        calendar_url: "https://calendar.app.google/UZC5UY38shFuSqmy6",
      },
    });
  }
  if (path.endsWith("/express-analysis-status")) {
    return route.fulfill({
      json: { status: "complete", data: report, username: "test" },
    });
  }
  if (path.endsWith("/express-analysis")) {
    return route.fulfill({
      json: { status: "processing", job_id: "fake-job", username: "test" },
    });
  }
  if (path.includes("/rest/v1/")) return route.fulfill({ json: [] });
  return route.abort();
});
try {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (
      const path of [
        "wavacademy",
        "wav-premium",
        "analyse-express",
        "wavacademy/appel",
        "reserverunappel",
      ]
    ) {
      await page.goto(`http://127.0.0.1:8080/${path}`);
      await page.locator("h1").waitFor();
      const refuse = page.getByRole("button", { name: "Refuser", exact: true });
      if (await refuse.count()) await refuse.click();
      assert.equal(
        await page.evaluate(() =>
          document.documentElement.scrollWidth <= innerWidth
        ),
        true,
        `Overflow ${path} ${width}`,
      );
      assert.equal(await page.locator("h1").count(), 1);
      await page.screenshot({
        path: `${output}/${path.replaceAll("/", "-")}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.goto("http://127.0.0.1:8080/wavacademy/appel");
  await page.getByLabel("Prénom *", { exact: true }).fill("Test");
  await page.getByLabel("E-mail *", { exact: true }).fill(
    "test@example.invalid",
  );
  await page.getByLabel("Ton compte ou ton projet de lancement *", {
    exact: true,
  }).fill("Je débute avec un projet vidéo concret.");
  await page.getByLabel("Ton objectif et ce qui te bloque aujourd’hui *", {
    exact: true,
  }).fill("Lancer une série cohérente de vidéos sur mon métier.");
  await page.getByRole("button", { name: "Valider et accéder au calendrier" })
    .click();
  assert.equal(applications, 0);
  assert.equal(
    await page.getByRole("link", { name: "Ouvrir le calendrier de l’appel" })
      .count(),
    0,
  );
  assert.match(await page.getByRole("alert").innerText(), /trois engagements/);
  for (const box of await page.locator("form input[type=checkbox]").all()) {
    await box.check();
  }
  await page.getByRole("button", { name: "Valider et accéder au calendrier" })
    .click();
  await page.getByRole("link", { name: "Ouvrir le calendrier de l’appel" })
    .waitFor();
  assert.equal(applications, 1);
  await page.goto("http://127.0.0.1:8080/start?utm_source=test#offre");
  await page.waitForURL("**/analyse-express?utm_source=test#offre");
  await page.locator('h1').waitFor();
  await page.getByRole('link', {name:'FredWav — Accueil'}).focus();
  await page.keyboard.press("Tab");
  assert.notEqual(
    await page.evaluate(() => document.activeElement.tagName),
    "BODY",
  );
  await page.goto(
    "http://127.0.0.1:8080/analyse-express/result?session_id=cs_test_FAKE",
  );
  await page.getByRole("button", { name: "Télécharger le rapport PDF" })
    .waitFor({ timeout: 20000 });
  const download = page.waitForEvent("download", { timeout: 60000 });
  await page.getByRole("button", { name: "Télécharger le rapport PDF" })
    .click();
  await (await download).saveAs(`${output}/rapport-test-120.pdf`);
  assert.deepEqual(errors, []);
  console.log(
    "OK : 15 contrôles de largeur, objections des trois offres, refus sans calendrier, débutant enregistré, redirection campagne, clavier, PDF 120 vidéos. Aucun appel de production.",
  );
} finally {
  await browser.close();
}
