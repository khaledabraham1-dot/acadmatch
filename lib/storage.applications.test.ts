import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadApplications } from "@/lib/storage";

/** localStorage minimal en mémoire — l'environnement de test est Node. */
function stubLocalStorage(initial: Record<string, string>) {
  const store = new Map(Object.entries(initial));
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    },
  });
}

const baseApplication = { formationId: "f-a", status: "à préparer", notes: "mes notes", documents: [], nextActions: [] };
const validPrep = {
  language: "français",
  generatedAt: "2026-09-26T10:00:00.000Z",
  questions: [{ id: "q1", category: "motivation", question: "Pourquoi ?", intent: "", answer: "Parce que" }],
};

describe("loadApplications — préparation d'entretien (Phase 18)", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  function load(interviewPrep: unknown) {
    stubLocalStorage({ "acadmatch:applications": JSON.stringify([{ ...baseApplication, interviewPrep }]) });
    return loadApplications();
  }

  it("conserve une préparation valide", () => {
    expect(load(validPrep)[0].interviewPrep).toEqual(validPrep);
  });

  it("écarte une préparation corrompue sans perdre la candidature", () => {
    for (const corrupted of [{ questions: "x" }, { ...validPrep, questions: [{ id: "q1" }] }, "texte"]) {
      const [application] = load(corrupted);
      expect(application.notes).toBe("mes notes");
      expect(application.interviewPrep).toBeUndefined();
    }
  });
});

describe("budgets (Phase 19)", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  const validPlan = {
    formationId: "f-a",
    feeProfile: "hors-ue",
    targetYear: "2027-2028",
    months: 12,
    monthlyCosts: { housing: 50_000, transport: 0, food: 0, other: 0 },
    oneOffCosts: { administrative: 0, settling: 0, other: 0 },
    monthlyResources: { scholarship: 0, family: 0, job: 0, other: 0 },
    oneOffResources: { savings: 0, other: 0 },
  };

  it("relit un budget valide et ignore un budget corrompu ou mal rattaché", async () => {
    const { loadBudgetPlan } = await import("@/lib/storage");
    stubLocalStorage({
      "acadmatch:budgets": JSON.stringify({
        "f-a": validPlan,
        "f-b": { ...validPlan, formationId: "f-b", monthlyCosts: { housing: -1, transport: 0, food: 0, other: 0 } },
        "f-c": { ...validPlan, formationId: "f-other" },
      }),
    });
    expect(loadBudgetPlan("f-a")).toEqual(validPlan);
    expect(loadBudgetPlan("f-b")).toBeNull();
    expect(loadBudgetPlan("f-c")).toBeNull();
    expect(loadBudgetPlan("inconnu")).toBeNull();
  });

  it("enregistre un budget sans écraser ceux des autres formations", async () => {
    const { loadBudgetPlan, saveBudgetPlan } = await import("@/lib/storage");
    stubLocalStorage({ "acadmatch:budgets": JSON.stringify({ "f-a": validPlan }) });
    saveBudgetPlan({ ...validPlan, formationId: "f-z", feeProfile: "ue" } as never);
    expect(loadBudgetPlan("f-a")).toEqual(validPlan);
    expect(loadBudgetPlan("f-z")?.feeProfile).toBe("ue");
  });
});
