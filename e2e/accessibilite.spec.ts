import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibilité (WCAG 2.1 AA) des pages principales, vérifiée par axe à
 * chaque modification (2026-10-01) : contraste des textes, libellés des
 * champs, noms des boutons, structure. Un texte trop pâle ou un bouton sans
 * nom fait échouer la CI.
 */
const EXAMPLE_PROFILE = {
  currentLevel: "Licence 3",
  fieldOfStudy: "Informatique",
  currentDegree: "Licence Informatique",
  courses: ["Algorithmique", "Bases de données", "Programmation orientée objet", "Statistiques", "Réseaux informatiques"].map((name, i) => ({ id: String(i), name })),
  skills: ["Python", "SQL", "Git", "Java"],
  goal: "Master",
  languages: ["Français", "Anglais"],
  academicStanding: "Bons résultats",
};

async function audit(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}) × ${v.nodes.length} : ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  expect(summary, `Violations d'accessibilité sur ${path}`).toEqual([]);
}

test.describe("accessibilité WCAG AA", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((profile) => {
      window.localStorage.setItem("acadmatch:profile", JSON.stringify(profile));
    }, EXAMPLE_PROFILE);
  });

  for (const path of [
    "/",
    "/profil",
    "/recherche",
    "/resultat?formationId=f-mosig-grenoble-inp",
    "/formations",
    "/formations/f-mosig-grenoble-inp",
    "/candidatures",
    "/budget",
    "/visa",
    "/compte",
    "/confidentialite",
    "/methode",
    "/guides",
    "/guides/cout-des-etudes-en-france",
    "/guides/etudes-en-france/benin",
    "/domaines/informatique",
  ]) {
    test(path, async ({ page }) => {
      await audit(page, path);
    });
  }
});
