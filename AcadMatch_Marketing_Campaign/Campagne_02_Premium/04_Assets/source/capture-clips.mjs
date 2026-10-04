// « Tournage » de l'interface RÉELLE d'AcadMatch, image par image, en haute
// définition (390 × 844 en densité 3 = 1170 × 2532) : vraies saisies, vraies
// listes d'autocomplétion, vrai aperçu qui se met à jour, vrais clics.
// Chaque clip = un dossier de JPEG numérotés + clip.json (nombre d'images).
// Usage : `npx next start -p 3300` à la racine, puis
//   node AcadMatch_Marketing_Campaign/Campagne_02_Premium/04_Assets/source/capture-clips.mjs [clip…]
import { chromium } from "@playwright/test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://localhost:3300";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "ui_clips");
const only = process.argv.slice(2);

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
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: "fr-FR" });
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

async function open(path, seed) {
  const page = await context.newPage();
  await page.addInitScript(([profile, apps, kind]) => {
    localStorage.clear();
    if (kind === "none") return;
    localStorage.setItem("acadmatch:profile", JSON.stringify(profile));
    localStorage.setItem("acadmatch:applications", JSON.stringify(apps));
    localStorage.setItem("acadmatch:visa", JSON.stringify({ citizenship: "hors-ue", residenceCountry: "Bénin" }));
  }, [PROFILE, [application("f-mosig-grenoble-inp"), application("f-master-bioinformatique-bordeaux")], seed]);
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "*{caret-color:transparent!important;scroll-behavior:auto!important} ::-webkit-scrollbar{display:none}" });
  await page.waitForTimeout(500);
  return page;
}

/** Enregistreur : chaque appel à frame() ajoute une image (n fois pour « tenir » un plan). */
function recorder(name) {
  const dir = join(OUT, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  let n = 0;
  const marks = {};
  const taps = [];
  return {
    /** Mémorise où et quand l'utilisateur « touche » l'écran (centre de l'élément, px CSS). */
    async tap(locator, label) {
      const b = await locator.boundingBox();
      taps.push({ label, frame: n, x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) });
    },
    async frame(page, hold = 1, clip) {
      const buf = await page.screenshot({ type: "jpeg", quality: 88, ...(clip ? { clip, fullPage: true } : {}) });
      for (let i = 0; i < hold; i++) writeFileSync(join(dir, `${String(++n).padStart(4, "0")}.jpg`), buf);
    },
    mark(label) { marks[label] = n; },
    done(extra = {}) {
      writeFileSync(join(dir, "clip.json"), JSON.stringify({ frames: n, marks, taps, viewport: { width: 390, height: 844 }, ...extra }, null, 1));
      console.log(`OK ${name} : ${n} images`, marks);
    },
  };
}

async function scroll(page, rec, to, frames) {
  const from = await page.evaluate(() => window.scrollY);
  for (let i = 1; i <= frames; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), from + (to - from) * ease(i / frames));
    await rec.frame(page);
  }
}
// Locator Playwright (accepte :has-text), pas querySelector.
const topOf = (page, sel, offset = 0) => page.locator(sel).first().evaluate((el, o) => el.getBoundingClientRect().top + window.scrollY - o, offset);

const CLIPS = {
  // Profil étape 2 : saisie réelle, autocomplétion réelle, aperçu qui se recalcule à chaque matière.
  async "profil-saisie"() {
    const page = await open("/profil", "none");
    await page.locator("#fieldOfStudy").selectOption("Informatique");
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, document.querySelector("form h3").getBoundingClientRect().top + window.scrollY - 150));
    const rec = recorder("profil-saisie");
    await rec.frame(page, 8);
    const input = page.getByRole("combobox", { name: "Vos matières" });
    await input.click();
    for (const [typed, full] of [["Algorith", "Algorithmique"], ["Bases de", "Bases de données"], ["Statist", "Statistiques"], ["Programmation or", "Programmation orientée objet"]]) {
      for (const ch of typed) {
        await input.press(ch === " " ? "Space" : ch);
        await page.waitForTimeout(40);
        await rec.frame(page);
      }
      await rec.frame(page, 3);
      await input.fill(full);
      await input.press("Enter");
      await page.waitForTimeout(250);
      rec.mark(full);
      await rec.frame(page, 6);
    }
    // Descente vers l'aperçu provisoire, qui vient de se mettre à jour.
    await scroll(page, rec, await topOf(page, "section[aria-labelledby='provisional-preview-title']", 180), 24);
    rec.mark("apercu");
    await rec.frame(page, 20);
    rec.done();
  },

  // Exemple en un clic : le formulaire se remplit, puis l'étape 2 et l'aperçu.
  async "profil-exemple"() {
    const page = await open("/profil", "none");
    const rec = recorder("profil-exemple");
    await rec.frame(page, 10);
    const example = page.getByRole("button", { name: /Exemple : L3 Informatique/ });
    await rec.tap(example, "exemple");
    await example.click();
    await page.waitForTimeout(300);
    rec.mark("rempli");
    await rec.frame(page, 6);
    await scroll(page, rec, await topOf(page, "nav[aria-label='Étapes du profil']", 20), 18);
    await rec.frame(page, 14);
    rec.done();
  },

  // Résultat : verdict, 3 actions, puis « Pourquoi ce score » s'ouvre sur le radar.
  async "resultat-radar"() {
    const page = await open("/resultat?formationId=f-mosig-grenoble-inp", "profile");
    const rec = recorder("resultat-radar");
    await rec.frame(page, 12);
    rec.mark("verdict");
    await scroll(page, rec, await topOf(page, "h2:has-text('Vos prochaines actions')", 60), 26);
    rec.mark("actions");
    await rec.frame(page, 18);
    const summary = page.locator("summary", { hasText: "Pourquoi ce score" });
    await scroll(page, rec, await summary.evaluate((el) => el.getBoundingClientRect().top + window.scrollY - 120), 20);
    await rec.frame(page, 6);
    await rec.tap(summary, "pourquoi");
    await summary.click();
    await page.waitForTimeout(250);
    rec.mark("ouvert");
    await rec.frame(page, 4);
    await scroll(page, rec, await page.locator("details[open] svg[role=img]").evaluate((el) => el.getBoundingClientRect().top + window.scrollY - 160), 22);
    rec.mark("radar");
    await rec.frame(page, 20);
    rec.done();
  },

  // Calendrier : la carte officielle Campus France Bénin, le clic « Ajouter », les rappels datés.
  async "calendrier-rappels"() {
    const page = await open("/calendrier", "profile");
    await page.evaluate(() => window.scrollTo(0, document.querySelector("#official-calendars-title").getBoundingClientRect().top + window.scrollY - 70));
    const rec = recorder("calendrier-rappels");
    await rec.frame(page, 12);
    const button = page.getByRole("button", { name: /Ajouter les \d+ échéances/ });
    await scroll(page, rec, await button.evaluate((el) => el.getBoundingClientRect().top + window.scrollY - 560), 24);
    rec.mark("bouton");
    await rec.frame(page, 10);
    await rec.tap(button, "ajouter");
    await button.click();
    await page.waitForTimeout(300);
    rec.mark("ajoute");
    await rec.frame(page, 12);
    await scroll(page, rec, await topOf(page, "h2:has-text('Vos rappels')", 90), 28);
    rec.mark("rappels");
    await rec.frame(page, 24);
    rec.done();
  },

  // Recherche avec le profil : recommandations et scores.
  async "recherche-scores"() {
    const page = await open("/recherche", "profile");
    const rec = recorder("recherche-scores");
    await rec.frame(page, 8);
    await scroll(page, rec, await topOf(page, "h2:has-text('Recommandé pour vous')", 80), 26);
    rec.mark("reco");
    await rec.frame(page, 12);
    await scroll(page, rec, (await page.evaluate(() => window.scrollY)) + 1500, 50);
    await rec.frame(page, 8);
    rec.done();
  },

  // Accueil → « Essayer un exemple » → recherche avec scores.
  async "accueil-exemple"() {
    const page = await open("/", "none");
    const rec = recorder("accueil-exemple");
    await rec.frame(page, 16);
    const tryIt = page.getByRole("button", { name: "Essayer un exemple" }).first();
    await rec.tap(tryIt, "essayer");
    await tryIt.click();
    await page.waitForURL(/recherche/);
    await page.waitForLoadState("networkidle");
    await page.addStyleTag({ content: "*{caret-color:transparent!important;scroll-behavior:auto!important}" });
    await page.waitForTimeout(400);
    rec.mark("recherche");
    await rec.frame(page, 10);
    await scroll(page, rec, await topOf(page, "h2:has-text('Recommandé pour vous')", 80), 26);
    await rec.frame(page, 14);
    rec.done();
  },

  // Guide : coût des études en euros et en francs CFA.
  async "guide-fcfa"() {
    const page = await open("/guides/cout-des-etudes-en-france", "none");
    const rec = recorder("guide-fcfa");
    await rec.frame(page, 10);
    await scroll(page, rec, await topOf(page, "#droits", 80), 30);
    rec.mark("droits");
    await rec.frame(page, 14);
    await scroll(page, rec, await topOf(page, "#visa", 80), 30);
    rec.mark("visa");
    await rec.frame(page, 14);
    rec.done();
  },

  // Fiche formation : prérequis vérifiés, compétences attendues, frais.
  async "fiche-formation"() {
    const page = await open("/formations/f-mosig-grenoble-inp", "none");
    const rec = recorder("fiche-formation");
    await rec.frame(page, 10);
    await scroll(page, rec, await topOf(page, "h2:has-text('Qui peut candidater')", 90), 30);
    rec.mark("prerequis");
    await rec.frame(page, 16);
    await scroll(page, rec, await topOf(page, "h2:has-text('Frais d')", 90), 30);
    rec.mark("frais");
    await rec.frame(page, 14);
    rec.done();
  },
};

for (const [name, run] of Object.entries(CLIPS)) {
  if (only.length && !only.includes(name)) continue;
  await run();
}
await browser.close();
