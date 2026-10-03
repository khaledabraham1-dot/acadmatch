import { expect, test, type Page } from "@playwright/test";

/**
 * Pages éditoriales (2026-10-03) : rendu serveur indexable, un seul h1,
 * titre et description propres, canonique, données structurées valides,
 * aucun défilement horizontal (tableaux compris) sur un téléphone de 360 px.
 */
const PAGES = [
  "/guides",
  "/guides/etudes-en-france",
  "/guides/etudes-en-france/benin",
  "/guides/master-en-france-etudiant-etranger",
  "/guides/licence-en-france-apres-un-bac-etranger",
  "/guides/etudier-en-belgique",
  "/guides/cout-des-etudes-en-france",
  "/guides/equivalence-diplome-etranger",
  "/domaines/informatique",
  "/domaines/droit",
];

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

for (const path of PAGES) {
  test(`page éditoriale ${path}`, async ({ page, request }) => {
    // Le HTML servi (sans JavaScript) contient déjà le contenu : c'est ce que lit un moteur de recherche.
    const html = await (await request.get(path)).text();
    expect(html).toContain("<h1");
    expect(html).toContain('type="application/ld+json"');

    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    expect((await page.title()).length).toBeLessThanOrEqual(75);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{70,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path.replace(/\//g, "\/")}$`));
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    for (const script of await page.locator('script[type="application/ld+json"]').all()) {
      const data = JSON.parse((await script.textContent()) ?? "null");
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) expect(item["@context"]).toBe("https://schema.org");
    }
    await expectNoHorizontalScroll(page);
  });
}

test("un domaine trop mince reste accessible mais hors index", async ({ page }) => {
  await page.goto("/domaines/chimie");
  await expect(page.locator("h1")).toContainText("chimie");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("le logo des données structurées est une vraie image", async ({ request }) => {
  const response = await request.get("/logo.png");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
});

test("plan du site et robots", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/guides/etudes-en-france/benin");
  expect(sitemap).toContain("/domaines/informatique");
  expect(sitemap).not.toContain("/domaines/chimie");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap:");
});
