import { describe, expect, it } from "vitest";
import { hasQuotaRemaining, MAX_AI_REQUESTS_PER_DAY } from "@/lib/ai/config";

describe("hasQuotaRemaining", () => {
  it("autorise tant que l'usage du jour est strictement sous la limite", () => {
    expect(hasQuotaRemaining(0, 5)).toBe(true);
    expect(hasQuotaRemaining(4, 5)).toBe(true);
  });

  it("refuse à la limite atteinte ou dépassée", () => {
    expect(hasQuotaRemaining(5, 5)).toBe(false);
    expect(hasQuotaRemaining(6, 5)).toBe(false);
  });

  it("utilise MAX_AI_REQUESTS_PER_DAY par défaut", () => {
    expect(hasQuotaRemaining(MAX_AI_REQUESTS_PER_DAY - 1)).toBe(true);
    expect(hasQuotaRemaining(MAX_AI_REQUESTS_PER_DAY)).toBe(false);
  });
});
