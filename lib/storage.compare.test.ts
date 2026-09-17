import { describe, expect, it } from "vitest";
import { compareResultsHref, MAX_COMPARE_FORMATIONS } from "@/lib/storage";

/**
 * Tests purs sur les helpers de comparaison (sans localStorage navigateur).
 * La persistance locale est défensive et couverte manuellement / via l'UI.
 */
describe("compareResultsHref", () => {
  it("renvoie la recherche si la liste est vide", () => {
    expect(compareResultsHref([])).toBe("/recherche");
  });

  it("ouvre l'analyse simple pour une seule formation", () => {
    expect(compareResultsHref(["f-a"])).toBe("/resultat?formationId=f-a");
  });

  it("construit l'URL de comparaison pour 2–3 formations", () => {
    expect(compareResultsHref(["f-a", "f-b"])).toBe("/resultat?compare=f-a,f-b");
    expect(compareResultsHref(["f-a", "f-b", "f-c", "f-d"])).toBe(
      "/resultat?compare=f-a,f-b,f-c",
    );
  });

  it("respecte le plafond documenté", () => {
    expect(MAX_COMPARE_FORMATIONS).toBe(3);
  });
});
