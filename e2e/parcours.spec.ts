import { expect, test, type Page } from "@playwright/test";

/** Aucune page ne doit défiler horizontalement (écran de 360px compris). */
async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("parcours principal : exemple → recherche → résultat", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("France et en Belgique");
  await expectNoHorizontalScroll(page);

  await page.getByRole("button", { name: "Essayer un exemple" }).first().click();
  await expect(page).toHaveURL(/\/recherche/);
  // Avec un profil, chaque carte affiche un score.
  await expect(page.getByText(/\d+%/).first()).toBeVisible();
  // Le domaine de l'étudiant d'abord, les autres repliés.
  await expect(page.getByText(/formations? dans votre domaine/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Voir les autres domaines/ })).toBeVisible();
  await expectNoHorizontalScroll(page);

  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: /Voir la compatibilité/ }).first().click();
  // Navigation client : jusqu'à 15 s sur une machine chargée (échecs intermittents à 5 s).
  await expect(page).toHaveURL(/\/resultat\?formationId=/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Correspondance des matières" })).toBeVisible();
  await expect(page.getByText(/ne garantit pas l.admission/)).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("une page formation est indexable et mène au calcul de compatibilité", async ({ page }) => {
  await page.goto("/formations");
  // Attendre l'hydratation : un clic trop tôt pouvait être perdu (échec intermittent constaté).
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: /Master 2 Data Science/ }).click();
  await expect(page).toHaveURL(/\/formations\/f-m2ds-ip-paris$/, { timeout: 15_000 });

  await expect(page).toHaveTitle(/Master 2 Data Science/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/formations\/f-m2ds-ip-paris$/);
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(jsonLd ?? "[]")[0]["@type"]).toBe("EducationalOccupationalProgram");
  await expectNoHorizontalScroll(page);

  await page.getByRole("link", { name: /Calculer ma compatibilité/ }).click();
  await expect(page).toHaveURL(/\/resultat\?formationId=f-m2ds-ip-paris/, { timeout: 15_000 });
});

test("les outils personnels ne sont pas indexés", async ({ page }) => {
  for (const path of ["/espace", "/candidatures", "/resultat", "/compte"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});

test("pages légales accessibles et liées depuis le pied de page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Confidentialité" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Politique de confidentialité");
  await expect(page.getByText("à compléter")).toHaveCount(0);
  await expectNoHorizontalScroll(page);
  for (const path of ["/mentions-legales", "/conditions"]) {
    await page.goto(path);
    await expectNoHorizontalScroll(page);
  }
});

test("en-têtes de sécurité présents", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("une formation inconnue renvoie 404", async ({ request }) => {
  expect((await request.get("/formations/nexiste-pas")).status()).toBe(404);
});

test("menu mobile en tuiles : il défile seul et la page derrière reste immobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "menu réservé au mobile");
  await page.goto("/recherche");
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu de navigation" });
  await expect(menu).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  // Le geste fait défiler le menu, pas la page.
  const pageScrollBefore = await page.evaluate(() => window.scrollY);
  await menu.hover();
  await page.mouse.wheel(0, 600);
  await expect.poll(() => menu.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageScrollBefore);

  await menu.getByRole("link", { name: "Budget" }).click();
  await expect(page).toHaveURL(/\/budget$/);
  await expect(menu).toBeHidden();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("profil : aucun domaine imposé, et un mot absurde est signalé tout de suite", async ({ page }) => {
  await page.goto("/profil");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#fieldOfStudy")).toHaveValue("");
  const courses = page.getByRole("combobox", { name: "Vos matières" });
  await courses.fill("Girafe");
  await courses.press("Enter");
  await expect(page.getByText(/Non reconnu comme matière ou compétence : « Girafe »/)).toBeVisible();
});
