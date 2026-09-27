import { describe, expect, it } from "vitest";
import { ETUDES_EN_FRANCE_COUNTRIES, VISA_GUIDES_BY_COUNTRY } from "@/data/visa";
import { needsStudentVisa, stepsForRoute, visaActionLabel, visaRoute } from "@/lib/visa";
import { addChecklistLabelsOnce } from "@/lib/applications";
import { computeBudget, createBudgetPlan } from "@/lib/budget";
import { getFormationById } from "@/data/formations";

const france = VISA_GUIDES_BY_COUNTRY.France;
const belgium = VISA_GUIDES_BY_COUNTRY.Belgique;

describe("données visa", () => {
  it("reprend les 73 pays de la page officielle Campus France, sans doublon", () => {
    expect(ETUDES_EN_FRANCE_COUNTRIES).toHaveLength(73);
    expect(new Set(ETUDES_EN_FRANCE_COUNTRIES).size).toBe(73);
    expect(ETUDES_EN_FRANCE_COUNTRIES).toContain("Pakistan");
  });

  it("ne cite que des liens officiels https, sans montant ni délai en euros recopié", () => {
    for (const guide of Object.values(VISA_GUIDES_BY_COUNTRY)) {
      for (const step of guide.steps) {
        expect(step.link.url).toMatch(/^https:\/\//);
        expect(step.description).not.toMatch(/\d+\s?€/);
      }
    }
  });
});

describe("parcours visa", () => {
  it("n'exige un visa que hors UE/EEE/Suisse", () => {
    expect(needsStudentVisa({ citizenship: "ue", residenceCountry: "" })).toBe(false);
    expect(needsStudentVisa({ citizenship: "hors-ue", residenceCountry: "Maroc" })).toBe(true);
  });

  it("oriente selon le pays de résidence", () => {
    expect(visaRoute(france, "Sénégal")).toBe("etudes-en-france");
    expect(visaRoute(france, "Autre pays")).toBe("direct");
    expect(visaRoute(france, "")).toBe("direct");
    // La Belgique n'a pas de procédure centralisée équivalente.
    expect(visaRoute(belgium, "Sénégal")).toBe("direct");
  });

  it("ne montre à chacun que ses étapes, dans l'ordre", () => {
    const eef = stepsForRoute(france, "etudes-en-france").map((s) => s.id);
    const direct = stepsForRoute(france, "direct").map((s) => s.id);
    expect(eef).toEqual(["fr-eef", "fr-resources", "fr-france-visas", "fr-vls-ts"]);
    expect(direct).toEqual(["fr-admission", "fr-resources", "fr-france-visas", "fr-vls-ts"]);
  });

  it("ajoute les étapes au suivi sans doublon", () => {
    const labels = stepsForRoute(france, "direct").map(visaActionLabel);
    const once = addChecklistLabelsOnce([], labels, france.source);
    const twice = addChecklistLabelsOnce(once, labels, france.source);
    expect(once).toHaveLength(4);
    expect(twice).toEqual(once);
    expect(once[0]).toMatchObject({ label: "Visa — Obtenir votre inscription ou préinscription", done: false });
  });
});

describe("vérification des ressources depuis la page Visa", () => {
  it("se calcule même avec le tarif UE quand la page sait qu'un visa est nécessaire", () => {
    const formation = getFormationById("f-mosef-paris1")!;
    const plan = createBudgetPlan(formation.id, new Date(2026, 8, 27));
    expect(computeBudget(plan, formation).visaCheck).toBeNull();
    expect(computeBudget(plan, formation, true).visaCheck?.requiredMonthlyCents).toBe(87_750);
  });
});
