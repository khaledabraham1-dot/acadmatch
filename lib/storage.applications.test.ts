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
