import { describe, expect, it } from "vitest";
import {
  addChecklistItem,
  addSuggestedDocuments,
  applicationStatusTone,
  createApplication,
  removeChecklistItem,
  setChecklistItemDueDate,
  sortApplicationsByUrgency,
  toggleChecklistItem,
  toggleChecklistItemRequired,
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

  it("setChecklistItemDueDate fixe le rappel personnel d'un seul élément", () => {
    const items = [
      { id: "1", label: "CV", done: false },
      { id: "2", label: "Lettre", done: false },
    ];
    const withDate = setChecklistItemDueDate(items, "1", "2026-02-10");
    expect(withDate.find((i) => i.id === "1")?.dueDate).toBe("2026-02-10");
    expect(withDate.find((i) => i.id === "2")?.dueDate).toBeUndefined();
  });

  it("setChecklistItemDueDate avec une date vide retire le rappel", () => {
    const items = [{ id: "1", label: "CV", done: false, dueDate: "2026-02-10" }];
    expect(setChecklistItemDueDate(items, "1", "")[0].dueDate).toBeUndefined();
    expect(setChecklistItemDueDate(items, "1", undefined)[0].dueDate).toBeUndefined();
  });

  it("toggleChecklistItemRequired inverse uniquement l'élément visé", () => {
    const items = [
      { id: "1", label: "CV", done: false },
      { id: "2", label: "Lettre", done: false, required: true },
    ];
    const toggled = toggleChecklistItemRequired(items, "1");
    expect(toggled.find((i) => i.id === "1")?.required).toBe(true);
    expect(toggled.find((i) => i.id === "2")?.required).toBe(true);
    expect(toggleChecklistItemRequired(toggled, "1").find((i) => i.id === "1")?.required).toBe(false);
  });
});

describe("addSuggestedDocuments (Phase 15)", () => {
  const suggestions = [
    { label: "État civil (pièce d'identité)", required: true },
    { label: "CV", required: true },
  ];
  const source = "https://example.gouv.fr/guide";

  it("ajoute chaque suggestion avec son required et la source fournie", () => {
    const items = addSuggestedDocuments([], suggestions, source);
    expect(items).toHaveLength(2);
    expect(items.every((i) => i.required === true && i.source === source && i.done === false)).toBe(true);
  });

  it("n'ajoute jamais un document obligatoire sans source (règle explicite de la phase)", () => {
    const items = addSuggestedDocuments([], suggestions, source);
    for (const item of items) {
      if (item.required) expect(item.source).toBeTruthy();
    }
  });

  it("ignore une suggestion déjà présente (comparaison insensible à la casse/accents), n'ajoute pas de doublon", () => {
    const existing = [{ id: "1", label: "cv", done: false }];
    const items = addSuggestedDocuments(existing, suggestions, source);
    expect(items).toHaveLength(2); // l'existant "cv" + seulement "État civil" ajouté
    expect(items.filter((i) => i.label.toLowerCase() === "cv")).toHaveLength(1);
  });

  it("un rejeu du même ajout (double clic) ne duplique rien", () => {
    const once = addSuggestedDocuments([], suggestions, source);
    const twice = addSuggestedDocuments(once, suggestions, source);
    expect(twice).toHaveLength(2);
  });
});
