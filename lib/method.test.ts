import { describe, expect, it } from "vitest";
import { ENGINE_WEIGHTS } from "@/lib/matching/engine";
import { catalogueFacts, compatibilityLabelThresholds, evidenceCapTable, mentionThresholds } from "./method";

describe("faits de la page Méthode, dérivés du moteur", () => {
  it("les poids affichés font 100 %", () => {
    const total = Object.values(ENGINE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(Math.round(total * 100)).toBe(100);
  });

  it("retrouve les seuils des libellés depuis le moteur", () => {
    expect(compatibilityLabelThresholds()).toEqual([
      { label: "Très compatible", min: 85 },
      { label: "Compatible", min: 65 },
      { label: "Partiellement compatible", min: 45 },
      { label: "Peu compatible", min: 0 },
    ]);
  });

  it("retrouve les seuils des mentions", () => {
    expect(mentionThresholds().map((m) => [m.mention, m.min])).toEqual([
      ["Très bien", 16],
      ["Bien", 14],
      ["Assez bien", 12],
      ["Passable", 10],
      ["Insuffisant", 0],
    ]);
  });

  it("le plafond de preuve monte avec chaque preuve", () => {
    const caps = evidenceCapTable().map((row) => row.cap);
    expect(caps).toEqual([...caps].sort((a, b) => a - b));
  });

  it("compte chaque formation une seule fois", () => {
    const facts = catalogueFacts();
    expect(facts.withOfficialRate + facts.openAccessOrExam + facts.notPublished).toBe(facts.formations);
  });
});
