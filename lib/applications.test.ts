import { describe, expect, it } from "vitest";
import {
  addChecklistItem,
  applicationStatusTone,
  createApplication,
  removeChecklistItem,
  sortApplicationsByUrgency,
  toggleChecklistItem,
} from "@/lib/applications";
import type { Application } from "@/types";

function application(overrides: Partial<Application> = {}): Application {
  return { ...createApplication("f-a"), ...overrides };
}

describe("applicationStatusTone", () => {
  it("associe une tonalité à chacun des 5 statuts", () => {
    expect(applicationStatusTone("à préparer")).toBe("neutral");
    expect(applicationStatusTone("prête")).toBe("info");
    expect(applicationStatusTone("envoyée")).toBe("warning");
    expect(applicationStatusTone("en attente")).toBe("warning");
    expect(applicationStatusTone("réponse reçue")).toBe("success");
  });
});

describe("sortApplicationsByUrgency", () => {
  it("place les statuts les moins avancés en premier", () => {
    const apps = [
      application({ formationId: "f-done", status: "réponse reçue" }),
      application({ formationId: "f-todo", status: "à préparer" }),
      application({ formationId: "f-sent", status: "envoyée" }),
    ];
    const sorted = sortApplicationsByUrgency(apps);
    expect(sorted.map((a) => a.formationId)).toEqual(["f-todo", "f-sent", "f-done"]);
  });

  it("à statut égal, trie par échéance croissante, sans échéance en dernier", () => {
    const apps = [
      application({ formationId: "f-none", status: "prête" }),
      application({ formationId: "f-late", status: "prête", deadline: "2026-03-01" }),
      application({ formationId: "f-early", status: "prête", deadline: "2026-01-15" }),
    ];
    const sorted = sortApplicationsByUrgency(apps);
    expect(sorted.map((a) => a.formationId)).toEqual(["f-early", "f-late", "f-none"]);
  });

  it("ne modifie pas le tableau d'origine", () => {
    const apps = [application({ formationId: "f-b", status: "en attente" }), application({ formationId: "f-a", status: "à préparer" })];
    const original = [...apps];
    sortApplicationsByUrgency(apps);
    expect(apps).toEqual(original);
  });
});

describe("createApplication", () => {
  it("crée une candidature vide au statut initial 'à préparer'", () => {
    const app = createApplication("f-x");
    expect(app).toEqual({
      formationId: "f-x",
      status: "à préparer",
      documents: [],
      nextActions: [],
      notes: "",
    });
  });
});

describe("checklist (documents / prochaines actions)", () => {
  it("addChecklistItem ajoute un élément non coché avec un id unique", () => {
    const items = addChecklistItem([], "Relevé de notes");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ label: "Relevé de notes", done: false });
    expect(items[0].id).toBeTruthy();
  });

  it("addChecklistItem ignore un libellé vide ou seulement des espaces", () => {
    expect(addChecklistItem([], "")).toEqual([]);
    expect(addChecklistItem([], "   ")).toEqual([]);
  });

  it("toggleChecklistItem inverse uniquement l'élément visé", () => {
    const items = [
      { id: "1", label: "CV", done: false },
      { id: "2", label: "Lettre", done: false },
    ];
    const toggled = toggleChecklistItem(items, "1");
    expect(toggled.find((i) => i.id === "1")?.done).toBe(true);
    expect(toggled.find((i) => i.id === "2")?.done).toBe(false);
  });

  it("removeChecklistItem retire uniquement l'élément visé", () => {
    const items = [
      { id: "1", label: "CV", done: false },
      { id: "2", label: "Lettre", done: false },
    ];
    expect(removeChecklistItem(items, "1")).toEqual([{ id: "2", label: "Lettre", done: false }]);
  });
});
