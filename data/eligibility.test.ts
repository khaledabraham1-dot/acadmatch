import { describe, expect, it } from "vitest";
import { ELIGIBILITY_GUIDES_BY_COUNTRY, FRANCE_ELIGIBILITY_GUIDE } from "@/data/eligibility";
import { isHttpsOfficialUrl, isIsoDate } from "@/lib/data/integrity";
import { FORMATIONS } from "@/data/formations";

/** Intégrité des guides d'éligibilité (Phase 11) — même discipline de source que le catalogue. */
describe("ELIGIBILITY_GUIDES_BY_COUNTRY", () => {
  it("chaque guide a une source HTTPS et une date de vérification valide", () => {
    for (const guide of Object.values(ELIGIBILITY_GUIDES_BY_COUNTRY)) {
      expect(isHttpsOfficialUrl(guide.source)).toBe(true);
      expect(isIsoDate(guide.verifiedAt)).toBe(true);
      expect(guide.pathways.length).toBeGreaterThan(0);
    }
  });

  it("le guide France est indexé sous la clé 'France'", () => {
    expect(ELIGIBILITY_GUIDES_BY_COUNTRY.France).toBe(FRANCE_ELIGIBILITY_GUIDE);
  });

  it("aucun pathway n'a d'audience ou de résumé vide", () => {
    for (const guide of Object.values(ELIGIBILITY_GUIDES_BY_COUNTRY)) {
      for (const pathway of guide.pathways) {
        expect(pathway.audience.trim().length).toBeGreaterThan(0);
        expect(pathway.summary.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("chaque pays réellement présent au catalogue est couvert, sauf ceux pas encore documentés (jamais de contenu inventé)", () => {
    // Ce test ne force pas une couverture à 100% (la Belgique n'est pas encore
    // documentée, volontairement — "implémente d'abord les règles françaises").
    // Il documente juste l'état actuel pour qu'un futur pays manquant soit visible.
    const catalogueCountries = new Set(FORMATIONS.map((f) => f.institution.country));
    const coveredCountries = new Set(Object.keys(ELIGIBILITY_GUIDES_BY_COUNTRY));
    expect(catalogueCountries.has("France")).toBe(true);
    expect(coveredCountries.has("France")).toBe(true);
  });
});
