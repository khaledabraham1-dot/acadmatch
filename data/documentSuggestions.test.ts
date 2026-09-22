import { describe, expect, it } from "vitest";
import { documentSuggestionFor, MON_MASTER_COMMON_DOCUMENTS } from "@/data/documentSuggestions";
import { isHttpsOfficialUrl, isIsoDate } from "@/lib/data/integrity";
import { FORMATIONS } from "@/data/formations";

describe("MON_MASTER_COMMON_DOCUMENTS", () => {
  it("a une source HTTPS, une date de vérification valide, et au moins un document", () => {
    expect(isHttpsOfficialUrl(MON_MASTER_COMMON_DOCUMENTS.source)).toBe(true);
    expect(isIsoDate(MON_MASTER_COMMON_DOCUMENTS.verifiedAt)).toBe(true);
    expect(MON_MASTER_COMMON_DOCUMENTS.items.length).toBeGreaterThan(0);
  });

  it("ne marque un document obligatoire que dans un jeu de suggestions qui porte lui-même une source", () => {
    // Règle de la phase : "ne déclare jamais un document obligatoire sans source".
    for (const item of MON_MASTER_COMMON_DOCUMENTS.items) {
      if (item.required) {
        expect(MON_MASTER_COMMON_DOCUMENTS.source.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("documentSuggestionFor", () => {
  it("propose le dossier commun Mon Master uniquement quand la procédure vérifiée le mentionne", () => {
    expect(documentSuggestionFor("Master 1 : plateforme nationale Mon Master, sur dossier.")).toBe(
      MON_MASTER_COMMON_DOCUMENTS,
    );
  });

  it("ne propose rien pour une procédure qui ne mentionne pas Mon Master, même pour un autre master", () => {
    expect(documentSuggestionFor("Plateforme de candidature dédiée à CentraleSupélec, par vagues successives.")).toBeNull();
  });

  it("ne propose rien pour Parcoursup (aucune liste générique universelle et sourcée)", () => {
    expect(documentSuggestionFor("Parcoursup pour les bacheliers français, UE/EEE/Suisse.")).toBeNull();
  });

  it("correspond à exactement 1 formation du catalogue réel actuel (SCDI Sorbonne) — documente l'état, pas une règle figée", () => {
    const matches = FORMATIONS.filter((f) => documentSuggestionFor(f.applicationProcedure) !== null);
    expect(matches.map((f) => f.id)).toEqual(["f-scdi-sorbonne"]);
  });
});
