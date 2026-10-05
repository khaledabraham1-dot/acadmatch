import { describe, expect, it } from "vitest";
import { isAdminEmail, parseAdminEmails } from "@/lib/admin/access";

describe("accès admin", () => {
  it("lit une liste d'adresses séparées par des virgules, sans tenir compte de la casse", () => {
    expect(parseAdminEmails(" A@exemple.com, b@exemple.com ,pasuneadresse,")).toEqual(["a@exemple.com", "b@exemple.com"]);
    expect(isAdminEmail("B@Exemple.com", "a@exemple.com,b@exemple.com")).toBe(true);
  });

  it("refuse tout le monde quand la variable est absente ou vide", () => {
    expect(isAdminEmail("a@exemple.com", undefined)).toBe(false);
    expect(isAdminEmail("a@exemple.com", "")).toBe(false);
    expect(isAdminEmail(null, "a@exemple.com")).toBe(false);
  });

  it("n'accepte pas une adresse qui ne fait que contenir une adresse admin", () => {
    expect(isAdminEmail("xa@exemple.com", "a@exemple.com")).toBe(false);
    expect(isAdminEmail("a@exemple.com.pirate.io", "a@exemple.com")).toBe(false);
  });
});
