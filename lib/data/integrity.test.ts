import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import {
  blockingCatalogueIssues,
  daysSince,
  effectiveVerificationStatus,
  isHttpsOfficialUrl,
  isIsoDate,
  isVerificationStale,
  VERIFICATION_MAX_AGE_DAYS,
} from "@/lib/data/integrity";

describe("intégrité catalogue — helpers", () => {
  it("accepte uniquement des URL HTTPS valides", () => {
    expect(isHttpsOfficialUrl("https://www.example.fr/master")).toBe(true);
    expect(isHttpsOfficialUrl("http://www.example.fr/master")).toBe(false);
    expect(isHttpsOfficialUrl("not-a-url")).toBe(false);
  });

  it("valide les dates ISO calendaires", () => {
    expect(isIsoDate("2026-09-15")).toBe(true);
    expect(isIsoDate("2026-13-40")).toBe(false);
    expect(isIsoDate("15/09/2026")).toBe(false);
  });

  it("détecte une vérification trop ancienne", () => {
    const now = new Date("2026-09-17T12:00:00.000Z");
    expect(isVerificationStale("2026-09-15", now)).toBe(false);
    expect(daysSince("2026-09-15", now)).toBe(2);

    const old = new Date("2027-04-01T12:00:00.000Z");
    expect(isVerificationStale("2026-09-15", old)).toBe(true);
    expect(VERIFICATION_MAX_AGE_DAYS).toBe(180);
  });
});

describe("intégrité du catalogue réel", () => {
  it("n'a aucune erreur bloquante", () => {
    const now = new Date("2026-09-17T12:00:00.000Z");
    expect(blockingCatalogueIssues(FORMATIONS, now)).toEqual([]);
  });

  it("ne présente aucune fiche démo comme réelle", () => {
    for (const formation of FORMATIONS) {
      if (formation.demo) {
        expect(formation.source).toContain("demo.acadmatch.fr");
        expect(effectiveVerificationStatus(formation)).toBe("démonstration");
      } else {
        expect(formation.source).not.toContain("demo.acadmatch.fr");
        expect(["vérifiée", "à revérifier"]).toContain(effectiveVerificationStatus(formation));
      }
    }
  });

  it("chaque formation réelle a une source HTTPS unique", () => {
    const real = FORMATIONS.filter((f) => !f.demo);
    const sources = real.map((f) => f.source);
    expect(new Set(sources).size).toBe(sources.length);
    for (const source of sources) {
      expect(isHttpsOfficialUrl(source)).toBe(true);
    }
  });
});
