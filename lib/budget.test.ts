import { describe, expect, it } from "vitest";
import {
  centsToInput,
  clampMonths,
  computeBudget,
  convertFromEuroCents,
  createBudgetPlan,
  currencyDigits,
  defaultTargetYear,
  formatEuros,
  parseEurosToCents,
  targetYearOptions,
} from "@/lib/budget";
import { FORMATIONS, getFormationById } from "@/data/formations";
import { TUITION_FEES } from "@/data/budget";
import type { BudgetPlan } from "@/types";

const SEPT_2026 = new Date(2026, 8, 27);
const master = getFormationById("f-mosef-paris1")!;
const ipParis = getFormationById("f-m2ds-ip-paris")!;
const uclouvain = getFormationById("f-date-uclouvain")!;
const telecom = getFormationById("f-ms-ia-telecom-paris")!;

function plan(overrides: Partial<BudgetPlan> = {}, formationId = master.id): BudgetPlan {
  return { ...createBudgetPlan(formationId, SEPT_2026), ...overrides };
}

describe("données sourcées", () => {
  it("couvre chaque formation du catalogue avec une source https et une année académique", () => {
    for (const formation of FORMATIONS) {
      const fee = TUITION_FEES[formation.id];
      expect(fee, formation.id).toBeDefined();
      for (const amount of [fee.eu, fee.nonEu]) {
        if (!amount) continue;
        expect(amount.source).toMatch(/^https:\/\//);
        expect(amount.academicYear).toMatch(/^\d{4}-\d{4}$/);
        expect(Number.isInteger(amount.cents)).toBe(true);
      }
      // Un tarif hors UE absent doit toujours être expliqué, jamais silencieux.
      if (!fee.nonEu) expect(fee.nonEuNote).toBeTruthy();
    }
  });
});

describe("defaultTargetYear", () => {
  it("prépare la rentrée suivante à partir de juillet", () => {
    expect(defaultTargetYear(SEPT_2026)).toBe("2027-2028");
    expect(defaultTargetYear(new Date(2026, 6, 1))).toBe("2027-2028");
    expect(defaultTargetYear(new Date(2026, 5, 30))).toBe("2026-2027");
    expect(targetYearOptions(SEPT_2026)).toEqual(["2027-2028", "2028-2029"]);
  });
});

describe("computeBudget — niveaux de fiabilité", () => {
  it("présente un montant 2026-2027 comme une estimation pour une rentrée 2027", () => {
    const summary = computeBudget(plan(), master);
    const tuition = summary.costs.find((l) => l.id === "tuition")!;
    expect(tuition.cents).toBe(25_500);
    expect(tuition.kind).toBe("estimation");
    expect(tuition.note).toMatch(/2026-2027/);
  });

  it("présente le même montant comme officiel quand l'année visée correspond", () => {
    const summary = computeBudget(plan({ targetYear: "2026-2027" }), master);
    expect(summary.costs.find((l) => l.id === "tuition")!.kind).toBe("officiel");
    expect(summary.costs.find((l) => l.id === "mandatory-0")!).toMatchObject({ cents: 10_500, kind: "officiel" });
  });

  it("garde un montant « à titre indicatif » en estimation même pour la bonne année", () => {
    const summary = computeBudget(plan({ targetYear: "2026-2027" }, ipParis.id), ipParis);
    expect(summary.costs.find((l) => l.id === "tuition")!.kind).toBe("estimation");
  });

  it("applique le tarif hors UE et signale le plafond d'exonération", () => {
    const summary = computeBudget(plan({ feeProfile: "hors-ue" }), master);
    const tuition = summary.costs.find((l) => l.id === "tuition")!;
    expect(tuition.cents).toBe(395_000);
    expect(tuition.note).toMatch(/30 %/);
  });

  it("signale un total incomplet quand le tarif hors UE n'est pas publié", () => {
    const summary = computeBudget(plan({ feeProfile: "hors-ue" }, uclouvain.id), uclouvain);
    expect(summary.missingOfficialAmounts).toHaveLength(1);
    // Le socle UE reste compté : seule la contribution supplémentaire est inconnue.
    expect(summary.costs.find((l) => l.id === "tuition")!.cents).toBe(119_400);
    // Pas de CVEC en Belgique.
    expect(summary.costs.some((l) => l.id.startsWith("mandatory"))).toBe(false);
  });

  it("compte un programme complet une seule fois", () => {
    const summary = computeBudget(plan({ months: 16 }, telecom.id), telecom);
    const tuition = summary.costs.find((l) => l.id === "tuition")!;
    expect(tuition.multiplier).toBe(1);
    expect(tuition.label).toMatch(/programme complet/);
  });
});

describe("computeBudget — calculs", () => {
  it("multiplie les montants mensuels par la durée et fait le solde exact en centimes", () => {
    const summary = computeBudget(
      plan({
        months: 10,
        monthlyCosts: { housing: 45_050, transport: 3_333, food: 20_000, other: 0 },
        oneOffCosts: { administrative: 5_000, settling: 0, other: 0 },
        monthlyResources: { scholarship: 0, family: 60_000, job: 20_001, other: 0 },
        oneOffResources: { savings: 100_000, other: 0 },
      }),
      master,
    );
    // 255 + 105 + (450,50 + 33,33 + 200) × 10 + 50 = 7 248,30 €
    expect(summary.totalCostCents).toBe(25_500 + 10_500 + (45_050 + 3_333 + 20_000) * 10 + 5_000);
    // (600 + 200,01) × 10 + 1 000 = 9 000,10 €
    expect(summary.totalResourcesCents).toBe((60_000 + 20_001) * 10 + 100_000);
    expect(summary.balanceCents).toBe(summary.totalResourcesCents - summary.totalCostCents);
    expect(summary.costByKind.officiel + summary.costByKind.estimation + summary.costByKind.hypothèse).toBe(
      summary.totalCostCents,
    );
  });

  it("borne la durée entre 1 et 24 mois", () => {
    expect(clampMonths(0)).toBe(1);
    expect(clampMonths(40)).toBe(24);
    expect(clampMonths(9.6)).toBe(10);
    expect(clampMonths(Number.NaN)).toBe(12);
  });
});

describe("computeBudget — seuil de ressources visa", () => {
  it("n'apparaît que pour un étudiant hors UE", () => {
    expect(computeBudget(plan(), master).visaCheck).toBeNull();
    expect(computeBudget(plan({ feeProfile: "hors-ue" }), master).visaCheck).not.toBeNull();
  });

  it("compare au seuil ce qui reste pour vivre après scolarité et frais ponctuels", () => {
    // 12 × 877,50 € = 10 530 € pour vivre + 3 950 € de scolarité + 105 € de CVEC.
    const exact = plan({ feeProfile: "hors-ue", oneOffResources: { savings: 1_053_000 + 395_000 + 10_500, other: 0 } });
    const check = computeBudget(exact, master).visaCheck!;
    expect(check.requiredMonthlyCents).toBe(87_750);
    expect(check.availableMonthlyCents).toBe(87_750);
    expect(check.meetsMinimum).toBe(true);

    const oneCentShort = { ...exact, oneOffResources: { savings: exact.oneOffResources.savings - 12, other: 0 } };
    expect(computeBudget(oneCentShort, master).visaCheck!.meetsMinimum).toBe(false);
  });

  it("utilise le seuil belge pour une formation en Belgique", () => {
    expect(computeBudget(plan({ feeProfile: "hors-ue" }, uclouvain.id), uclouvain).visaCheck!.requiredMonthlyCents).toBe(
      106_200,
    );
  });
});

describe("saisie et arrondis", () => {
  it("lit les formats français de montants", () => {
    expect(parseEurosToCents("1 200")).toBe(120_000);
    expect(parseEurosToCents("1 200,5")).toBe(120_050);
    expect(parseEurosToCents("877,50 €")).toBe(87_750);
    expect(parseEurosToCents("12.34")).toBe(1_234);
    expect(parseEurosToCents("")).toBe(0);
  });

  it("refuse les saisies invalides", () => {
    expect(parseEurosToCents("-5")).toBeNull();
    expect(parseEurosToCents("12,345")).toBeNull();
    expect(parseEurosToCents("abc")).toBeNull();
    expect(parseEurosToCents("1e5")).toBeNull();
    expect(parseEurosToCents("99999999999")).toBeNull();
  });

  it("fait l'aller-retour saisie ↔ centimes", () => {
    for (const cents of [0, 5, 50, 87_750, 120_050, 100_000]) {
      expect(parseEurosToCents(centsToInput(cents))).toBe(cents);
    }
  });

  it("convertit avec l'unité mineure de la devise cible", () => {
    expect(currencyDigits("EUR")).toBe(2);
    expect(currencyDigits("XOF")).toBe(0);
    // Parité fixe officielle : 1 € = 655,957 FCFA.
    expect(convertFromEuroCents(87_750, 655.957, "XOF")).toBe(575_602);
    expect(convertFromEuroCents(100, 655.957, "XOF")).toBe(656);
    expect(convertFromEuroCents(1, 655.957, "XOF")).toBe(7);
    // Taux flottant saisi par l'étudiant : arrondi au centime.
    expect(convertFromEuroCents(87_750, 10.8, "MAD")).toBe(9_477);
    expect(convertFromEuroCents(12_345, 1.0873, "USD")).toBe(134.23);
  });

  it("formate les euros sans décimales inutiles", () => {
    expect(formatEuros(25_500).replace(/\s/g, " ")).toBe("255 €");
    expect(formatEuros(87_750).replace(/\s/g, " ")).toBe("877,50 €");
  });
});
