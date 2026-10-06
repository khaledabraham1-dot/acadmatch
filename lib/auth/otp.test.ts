import { describe, expect, it } from "vitest";
import { isValidOtpCode, normalizeOtpCode } from "@/lib/auth/otp";

describe("code de connexion", () => {
  it("accepte 6 chiffres, même saisis avec des espaces ou un tiret", () => {
    expect(isValidOtpCode(normalizeOtpCode(" 123 456 "))).toBe(true);
    expect(isValidOtpCode(normalizeOtpCode("123-456"))).toBe(true);
  });
  it("refuse tout le reste", () => {
    for (const bad of ["12345", "1234567", "12a456", ""]) expect(isValidOtpCode(normalizeOtpCode(bad))).toBe(false);
  });
});
