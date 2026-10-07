import { describe, expect, it } from "vitest";
import { adminBasePath, isAdminEmail, isInternalAdminPath, isRecentSignIn, parseAdminEmails, toInternalAdminPath } from "@/lib/admin/access";

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

describe("adresse secrète de l'admin", () => {
  it("n'accepte qu'un segment long, en minuscules, chiffres et tirets", () => {
    expect(adminBasePath("pilotage-k7m2x9q4w8r3")).toBe("/pilotage-k7m2x9q4w8r3");
    expect(adminBasePath("/pilotage-k7m2x9q4w8r3/")).toBe("/pilotage-k7m2x9q4w8r3");
    expect(adminBasePath("court")).toBeNull();
    expect(adminBasePath("Pilotage-K7M2X9Q4W8R3")).toBeNull();
    expect(adminBasePath("pilotage/k7m2x9q4w8r3x")).toBeNull();
    expect(adminBasePath(undefined)).toBeNull();
  });

  it("traduit l'adresse secrète vers le dossier interne, et seulement elle", () => {
    const base = "/pilotage-k7m2x9q4w8r3";
    expect(toInternalAdminPath(base, base)).toBe("/admin");
    expect(toInternalAdminPath(`${base}/donnees`, base)).toBe("/admin/donnees");
    expect(toInternalAdminPath(`${base}x`, base)).toBeNull();
    expect(toInternalAdminPath("/compte", base)).toBeNull();
    expect(toInternalAdminPath(base, null)).toBeNull();
  });

  it("repère les appels directs au dossier /admin", () => {
    expect(isInternalAdminPath("/admin")).toBe(true);
    expect(isInternalAdminPath("/admin/export")).toBe(true);
    expect(isInternalAdminPath("/administration")).toBe(false);
  });
});
