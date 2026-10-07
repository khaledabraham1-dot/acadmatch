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
  // Verdict et actions d'abord ; l'analyse détaillée est repliée.
  await expect(page.getByRole("heading", { name: "Vos prochaines actions" })).toBeVisible();
  const details = page.locator("details", { hasText: "Correspondance des matières" });
  await expect(details).toHaveJSProperty("open", false);
  await details.getByText("Correspondance des matières", { exact: true }).click();
  await expect(details).toHaveJSProperty("open", true);
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

  // Sur mobile, un raccourci reprend ce lien sous le titre : les deux mènent au même calcul.
  await page.getByRole("link", { name: /Calculer ma compatibilité/ }).first().click();
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
  // Étape 1 : impossible d'avancer sans domaine.
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByText("Choisissez votre domaine d'études pour continuer.")).toBeVisible();
  await page.locator("#fieldOfStudy").selectOption("Droit");
  await page.getByRole("button", { name: "Continuer" }).click();

  // Étape 2 : un mot absurde est signalé tout de suite.
  const courses = page.getByRole("combobox", { name: "Vos matières" });
  await courses.fill("Girafe");
  await courses.press("Enter");
  await expect(page.getByText(/Non reconnu comme matière ou compétence : « Girafe »/)).toBeVisible();
});

test("profil en trois étapes : un premier résultat dès l'étape 2", async ({ page }) => {
  await page.goto("/profil");
  await page.waitForLoadState("networkidle");
  await page.locator("#fieldOfStudy").selectOption("Informatique");
  await page.getByRole("button", { name: "Continuer" }).click();

  const preview = page.getByRole("region", { name: "Aperçu provisoire de vos résultats" });
  await expect(preview).toContainText("Ajoutez une première matière");
  const courses = page.getByRole("combobox", { name: "Vos matières" });
  await courses.fill("Bases de données");
  await courses.press("Enter");
  await expect(preview.getByRole("listitem")).toHaveCount(3);
  await expect(preview.getByText(/\d+%/).first()).toBeVisible();
  await expectNoHorizontalScroll(page);

  // L'étape 3 est optionnelle : on voit ses résultats directement.
  await page.getByRole("button", { name: "Voir mes résultats" }).click();
  await expect(page).toHaveURL(/\/recherche/, { timeout: 15_000 });
});

// Échouera après la clôture de la campagne (31 mai 2027) : c'est le signal de relever le calendrier suivant (data/campaigns.ts).
test("calendrier : un résident du Bénin voit le calendrier Campus France officiel et l'ajoute à ses rappels", async ({ page }) => {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem("seeded")) return;
    window.sessionStorage.setItem("seeded", "1");
    const application = (formationId: string) => ({ formationId, status: "à préparer", documents: [], nextActions: [], notes: "" });
    window.localStorage.setItem(
      "acadmatch:applications",
      JSON.stringify([application("f-master-bioinformatique-bordeaux"), application("f-mosig-grenoble-inp")]),
    );
    window.localStorage.setItem("acadmatch:visa", JSON.stringify({ citizenship: "hors-ue", residenceCountry: "Bénin" }));
  });
  await page.goto("/calendrier");
  await page.waitForLoadState("networkidle");

  // Master national + résident du Bénin : Campus France, pas Mon Master.
  await expect(page.getByRole("heading", { name: "Études en France (Bénin)" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mon Master" })).toHaveCount(0);
  await expect(page.getByText(/Officiel · rentrée \d{4}/)).toBeVisible();
  // L'école garde son propre calendrier.
  await expect(page.getByRole("heading", { name: "Calendrier propre à l'établissement" })).toBeVisible();
  await expectNoHorizontalScroll(page);

  await page.getByRole("button", { name: /Ajouter les \d+ échéances à mes rappels/ }).click();
  await expect(page.getByText("Ajoutées à vos rappels")).toBeVisible();
  await expect(page.getByText("Études en France (Bénin) : Dépôt définitif après corrections")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Études en France (Bénin) : Dépôt définitif après corrections")).toBeVisible();
});

test("l'adresse /admin est introuvable : l'espace admin n'est servi qu'à son adresse secrète", async ({ page, request }) => {
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Pilotage AcadMatch")).toHaveCount(0);
  for (const path of ["/admin/export?type=demandes", "/admin/donnees?jours=30"]) {
    const sub = await request.get(path);
    expect(sub.status()).toBe(404);
    expect(sub.headers()["content-type"]).not.toMatch(/csv|json/);
    expect(await sub.text()).not.toContain("Formation demandée");
  }
});
