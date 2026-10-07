import { describe, expect, it } from "vitest";
import { authErrorMessage, passwordProblem } from "@/lib/auth/password";

describe("mot de passe", () => {
  it("exige 8 caractères, une lettre et un chiffre", () => {
    expect(passwordProblem("abc12")).toMatch(/8 caractères/);
    expect(passwordProblem("abcdefgh")).toMatch(/lettre et un chiffre/);
    expect(passwordProblem("12345678")).toMatch(/lettre et un chiffre/);
    expect(passwordProblem("étudiant2027")).toBeNull();
  });

  it("vérifie la confirmation quand elle est demandée", () => {
    expect(passwordProblem("motdepasse1", "motdepasse2")).toMatch(/correspondent pas/);
    expect(passwordProblem("motdepasse1", "motdepasse1")).toBeNull();
  });

  it("refuse au-delà de 72 caractères (limite de Supabase)", () => {
    expect(passwordProblem(`a1${"x".repeat(71)}`)).toMatch(/72/);
  });

  it("traduit les erreurs de Supabase sans révéler de détail technique", () => {
    expect(authErrorMessage({ code: "invalid_credentials", status: 400 }, "signin")).toMatch(/Mot de passe oublié/);
    expect(authErrorMessage({ status: 429 }, "reset")).toMatch(/Patientez/);
    expect(authErrorMessage({ code: "inconnu", status: 500 }, "signup")).toMatch(/n'a pas pu être créé/);
  });
});
