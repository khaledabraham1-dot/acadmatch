import { describe, expect, it } from "vitest";
import {
  estimateAcademicLevel,
  MAX_VALIDATED_YEARS,
  VALIDATED_YEARS_OPTIONS,
} from "@/lib/profile/degreeEquivalence";

describe("estimateAcademicLevel", () => {
  it("aligne le nombre d'années validées sur le niveau français équivalent (Licence = Bac+3, Master = Bac+5)", () => {
    expect(estimateAcademicLevel(0)).toBe("Baccalauréat");
    expect(estimateAcademicLevel(1)).toBe("Licence 1");
    expect(estimateAcademicLevel(2)).toBe("Licence 2");
    expect(estimateAcademicLevel(3)).toBe("Licence 3");
    expect(estimateAcademicLevel(4)).toBe("Master 1");
    expect(estimateAcademicLevel(5)).toBe("Master 2");
    expect(estimateAcademicLevel(6)).toBe("Doctorat");
  });

  it("ramène une saisie hors bornes à la valeur valide la plus proche plutôt que de planter", () => {
    expect(estimateAcademicLevel(-3)).toBe("Baccalauréat");
    expect(estimateAcademicLevel(42)).toBe("Doctorat");
  });

  it("arrondit une saisie non entière", () => {
    expect(estimateAcademicLevel(2.6)).toBe(estimateAcademicLevel(3));
  });

  it("le dernier niveau atteignable correspond exactement à MAX_VALIDATED_YEARS", () => {
    expect(estimateAcademicLevel(MAX_VALIDATED_YEARS)).toBe("Doctorat");
  });

  it("propose une option de sélection pour chaque année de 0 à MAX_VALIDATED_YEARS, sans trou ni doublon", () => {
    const years = VALIDATED_YEARS_OPTIONS.map((option) => option.years);
    expect(years).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(new Set(years).size).toBe(years.length);
    expect(Math.max(...years)).toBe(MAX_VALIDATED_YEARS);
  });
});
