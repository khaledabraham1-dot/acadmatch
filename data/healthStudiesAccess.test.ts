import { describe, expect, it } from "vitest";
import { HEALTH_STUDIES_ACCESS, HEALTH_STUDIES_VERIFIED_AT } from "@/data/healthStudiesAccess";
import { FORMATIONS } from "@/data/formations";

describe("encart accès aux études de santé", () => {
  it("couvre la France et la Belgique, chaque règle avec une source officielle https", () => {
    expect(HEALTH_STUDIES_ACCESS.map((rule) => rule.country)).toEqual(["France", "Belgique"]);
    for (const rule of HEALTH_STUDIES_ACCESS) {
      expect(rule.source.url.startsWith("https://")).toBe(true);
      expect(rule.points.length).toBeGreaterThan(0);
    }
    expect(HEALTH_STUDIES_VERIFIED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("aucune fiche du catalogue ne présente médecine, pharmacie ou PASS comme formation sur dossier", () => {
    // Ces filières sont expliquées par l'encart, jamais notées comme des fiches.
    const pattern = /\b(PASS|m[ée]decine|pharmacie|odontologie)\b/i;
    const offending = FORMATIONS.filter((f) => f.field === "Biologie & Santé" && pattern.test(f.name));
    expect(offending).toEqual([]);
  });
});
