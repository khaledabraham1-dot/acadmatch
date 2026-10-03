// Captures RÉELLES de l'interface AcadMatch (build de production local), utilisées
// telles quelles dans les vidéos : aucune maquette, aucun écran inventé.
// Usage : lancer `npx next start -p 3300` à la racine, puis
//   node AcadMatch_Marketing_Campaign/04_Assets/source/capture-ui.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://localhost:3300";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "ui");
mkdirSync(OUT, { recursive: true });

// Profil exemple du site (data/example-profile.ts) : L3 Informatique → Master.
const PROFILE = {
  currentLevel: "Licence 3",
  fieldOfStudy: "Informatique",
  currentDegree: "Licence Informatique",
  courses: ["Algorithmique", "Bases de données", "Programmation orientée objet", "Statistiques", "Réseaux informatiques"].map((name, i) => ({ id: `ex-c${i + 1}`, name })),
  skills: ["Python", "SQL", "Git", "Java"],
  goal: "Master",
  languages: ["Français", "Anglais"],
  academicStanding: "Bons résultats",
};
const application = (formationId) => ({ formationId, status: "à préparer", documents: [], nextActions: [], notes: "" });

const browser = await chromium.launch();
// Téléphone type (390 × 844) en densité 3 : captures nettes une fois agrandies en 1080 × 1920.
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: "fr-FR" });

async function page(path, { seed = "profile", wait = 600 } = {}) {
  const p = await context.newPage();
  await p.addInitScript(
    ([profile, apps, seedKind]) => {
      if (seedKind === "none") return;
      localStorage.setItem("acadmatch:profile", JSON.stringify(profile));
      localStorage.setItem("acadmatch:applications", JSON.stringify(apps));
      localStorage.setItem("acadmatch:visa", JSON.stringify({ citizenship: "hors-ue", residenceCountry: "Bénin" }));
    },
    [PROFILE, [application("f-mosig-grenoble-inp"), application("f-master-bioinformatique-bordeaux")], seed],
  );
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  // Pas de bandeau d'analyse ni de curseur parasite dans les captures.
  await p.addStyleTag({ content: "*{caret-color:transparent!important} ::-webkit-scrollbar{display:none}" });
  await p.waitForTimeout(wait);
  return p;
}

async function shot(p, name, { fullPage = false, locator } = {}) {
  const file = join(OUT, `${name}.png`);
  if (locator) await p.locator(locator).first().screenshot({ path: file });
  else await p.screenshot({ path: file, fullPage });
  console.log("✓", name);
}

// 1. Accueil (nouveau visiteur)
{
  const p = await page("/", { seed: "none" });
  await shot(p, "home-hero");
  await p.close();
}

// 2. Profil — étape 1 puis étape 2 avec l'aperçu provisoire réel
{
  const p = await page("/profil", { seed: "none" });
  await p.locator("#fieldOfStudy").selectOption("Informatique");
  await p.evaluate(() => window.scrollTo(0, document.querySelector("nav[aria-label='Étapes du profil']").getBoundingClientRect().top + window.scrollY - 12));
  await p.waitForTimeout(300);
  await shot(p, "profil-etape1");
  await p.getByRole("button", { name: "Continuer" }).click();
  for (const course of ["Algorithmique", "Bases de données", "Programmation orientée objet", "Statistiques"]) {
    const input = p.getByRole("combobox", { name: "Vos matières" });
    await input.fill(course);
    await input.press("Enter");
  }
  await p.waitForTimeout(700);
  await shot(p, "profil-matieres-card", { locator: "form section ~ div, form .space-y-6 > div:has(h3)" }).catch(() => {});
  await shot(p, "profil-apercu", { locator: "section[aria-labelledby='provisional-preview-title']" });
  await shot(p, "profil-etape2-full", { fullPage: true });
  await p.close();
}

// 3. Recherche avec le profil : cartes et scores
{
  const p = await page("/recherche");
  await shot(p, "recherche-top");
  await shot(p, "recherche-full", { fullPage: true });
  await p.close();
}

// 4. Résultat : verdict, 3 actions, radar
{
  const p = await page("/resultat?formationId=f-mosig-grenoble-inp");
  await shot(p, "resultat-top");
  await shot(p, "resultat-verdict", { locator: "main .space-y-6 > div:first-child" });
  await shot(p, "resultat-actions", { locator: "main h2:has-text('Vos prochaines actions') >> xpath=ancestor::div[contains(@class,'rounded-[18px]')][1]" });
  await p.locator("summary", { hasText: "Pourquoi ce score" }).click();
  await p.waitForTimeout(400);
  await shot(p, "resultat-radar", { locator: "details[open] svg[role=img]" });
  await shot(p, "resultat-full", { fullPage: true });
  await p.close();
}

// 5. Calendrier : calendrier officiel Campus France Bénin
{
  const p = await page("/calendrier");
  await shot(p, "calendrier-benin", { locator: "section[aria-labelledby='official-calendars-title'] >> div.rounded-\\[18px\\] >> nth=0" });
  await shot(p, "calendrier-full", { fullPage: true });
  await p.close();
}

// 6. Guides : coût en FCFA, calendrier Bénin
{
  const p = await page("/guides/cout-des-etudes-en-france");
  await shot(p, "guide-cout-cartes", { locator: "#droits ~ div ul.sm\\:hidden, section[aria-labelledby='droits'] ul" });
  await shot(p, "guide-cout-full", { fullPage: true });
  await p.close();
}
{
  const p = await page("/guides/etudes-en-france/benin");
  await shot(p, "guide-benin-calendrier", { locator: "section[aria-labelledby='calendrier'] ol" });
  await p.close();
}

// 7. Fiche formation
{
  const p = await page("/formations/f-mosig-grenoble-inp");
  await shot(p, "formation-top");
  await p.close();
}

await browser.close();
