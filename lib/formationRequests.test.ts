import { describe, expect, it } from "vitest";
import { isValidRequest, toFormationRequestRow, type FormationRequestPayload } from "@/lib/formationRequests";

const payload: FormationRequestPayload = {
  wanted: "  Master Économie du développement  ",
  institution: "  ",
  country: "France",
  source: "recherche-vide",
  searchQuery: "économie",
  profileField: "Économie",
  profileLevel: "Licence 3",
  profileGoal: "Master",
};

describe("demandes de formation manquante", () => {
  it("refuse une demande vide ou trop courte", () => {
    expect(isValidRequest("  ")).toBe(false);
    expect(isValidRequest("a")).toBe(false);
    expect(isValidRequest("MBA")).toBe(true);
  });

  it("construit une ligne anonyme, nettoyée et bornée comme les contraintes SQL", () => {
    const row = toFormationRequestRow({ ...payload, searchQuery: "x".repeat(500) });
    expect(row.wanted).toBe("Master Économie du développement");
    expect(row.institution).toBeNull();
    expect(row.search_query).toHaveLength(120);
    expect(Object.keys(row)).not.toContain("email");
    expect(Object.keys(row)).not.toContain("user_id");
  });

  it("borne la demande à 200 caractères", () => {
    expect(toFormationRequestRow({ ...payload, wanted: "y".repeat(400) }).wanted).toHaveLength(200);
  });
});
