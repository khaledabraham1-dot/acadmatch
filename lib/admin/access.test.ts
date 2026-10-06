import { describe, expect, it } from "vitest";
import { isAdminEmail, isRecentSignIn, parseAdminEmails } from "@/lib/admin/access";

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

describe("connexion récente pour l'admin", () => {
  const now = new Date("2026-10-06T12:00:00Z");
  it("accepte une connexion de moins de 12 heures", () => {
    expect(isRecentSignIn("2026-10-06T01:00:00Z", now)).toBe(true);
  });
  it("refuse une session ancienne, absente ou invalide", () => {
    expect(isRecentSignIn("2026-10-05T23:59:00Z", now)).toBe(false);
    expect(isRecentSignIn(null, now)).toBe(false);
    expect(isRecentSignIn("pas une date", now)).toBe(false);
  });
});
