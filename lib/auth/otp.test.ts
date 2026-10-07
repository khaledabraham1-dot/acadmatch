import { describe, expect, it } from "vitest";
import { isValidOtpCode, normalizeOtpCode, qrImageSrc } from "@/lib/auth/otp";

describe("code de connexion", () => {
  it("accepte 6 chiffres, même saisis avec des espaces ou un tiret", () => {
    expect(isValidOtpCode(normalizeOtpCode(" 123 456 "))).toBe(true);
    expect(isValidOtpCode(normalizeOtpCode("123-456"))).toBe(true);
  });
  it("refuse tout le reste", () => {
    for (const bad of ["12345", "1234567", "12a456", ""]) expect(isValidOtpCode(normalizeOtpCode(bad))).toBe(false);
  });
});

describe("QR code de la double vérification", () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#000" d="M0 0h1v1H0z"/></svg>';
  it("n'ajoute jamais un deuxième préfixe à l'image déjà préparée par Supabase", () => {
    const src = qrImageSrc(`data:image/svg+xml;utf-8,${svg}`);
    expect(src.match(/data:/g)).toHaveLength(1);
    expect(decodeURIComponent(src.slice(src.indexOf(",") + 1))).toBe(svg);
  });
  it("encode le « # » des couleurs, qui couperait l'image", () => {
    expect(qrImageSrc(svg)).not.toContain("#");
  });
});
