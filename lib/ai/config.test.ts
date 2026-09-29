import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AI_FEATURES,
  costOfCall,
  ESTIMATED_COST_USD,
  featureKind,
  featuresOfKind,
  globalDailyBudgetUsd,
} from "@/lib/ai/config";

describe("costOfCall", () => {
  it("applique les tarifs par million de tokens du modèle", () => {
    // Mesure réelle du 2026-09-28 : import d'un programme SMI sur Opus 5.
    expect(costOfCall("claude-opus-5", { input_tokens: 5_084, output_tokens: 1_000 })).toBeCloseTo(0.05042, 5);
    expect(costOfCall("claude-haiku-4-5", { input_tokens: 1_000_000, output_tokens: 0 })).toBe(1);
  });

  it("compte le cache (écriture ×1,25, lecture ×0,1)", () => {
    const cost = costOfCall("claude-haiku-4-5", {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 1_000_000,
      cache_read_input_tokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(1.35, 5);
  });

  it("compte un modèle inconnu (repli serveur) au tarif Opus, jamais moins", () => {
    expect(costOfCall("modele-inconnu", { input_tokens: 1_000_000, output_tokens: 0 })).toBe(5);
  });
});

describe("familles de fonctionnalités", () => {
  it("classe les imports à part, et une fonctionnalité inconnue au plus strict", () => {
    expect(featureKind("releve-notes")).toBe("import");
    expect(featureKind("programme-formation")).toBe("import");
    expect(featureKind("lettre-motivation")).toBe("texte");
    expect(featureKind("nouvelle-fonctionnalite")).toBe("import");
    expect(featuresOfKind("import").sort()).toEqual(["programme-formation", "releve-notes"]);
    expect(Object.keys(AI_FEATURES)).toHaveLength(5);
  });

  it("réserve le pire cas : un import coûte plus cher qu'un texte", () => {
    expect(ESTIMATED_COST_USD.import).toBeGreaterThan(ESTIMATED_COST_USD.texte);
    expect(ESTIMATED_COST_USD.import).toBeLessThan(0.5);
  });
});

describe("globalDailyBudgetUsd", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("vaut 0,50 $ par défaut, y compris si la variable est vide ou invalide", () => {
    vi.stubEnv("AI_DAILY_BUDGET_USD", "");
    expect(globalDailyBudgetUsd()).toBe(0.5);
    vi.stubEnv("AI_DAILY_BUDGET_USD", "  ");
    expect(globalDailyBudgetUsd()).toBe(0.5);
    vi.stubEnv("AI_DAILY_BUDGET_USD", "abc");
    expect(globalDailyBudgetUsd()).toBe(0.5);
    vi.stubEnv("AI_DAILY_BUDGET_USD", "-1");
    expect(globalDailyBudgetUsd()).toBe(0.5);
  });

  it("suit la variable d'environnement, « 0 » servant d'interrupteur d'urgence", () => {
    vi.stubEnv("AI_DAILY_BUDGET_USD", "2");
    expect(globalDailyBudgetUsd()).toBe(2);
    vi.stubEnv("AI_DAILY_BUDGET_USD", "0");
    expect(globalDailyBudgetUsd()).toBe(0);
  });
});
