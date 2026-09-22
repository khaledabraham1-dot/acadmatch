import { describe, expect, it } from "vitest";
import { buildTargetedFormations, summarizeStudyProject } from "@/lib/studyProject";
import { createApplication } from "@/lib/applications";
import type { Application, StudyProgram } from "@/types";

function formation(overrides: Partial<StudyProgram> = {}): StudyProgram {
  return {
    id: "f-a",
    name: "Master Test",
    institution: { name: "Université Test", city: "Paris", country: "France" },
    level: "Master 1",
    goal: "Master",
    field: "Informatique",
    description: "",
    prerequisites: [],
    coreCourses: [],
    skills: [],
    requiredLevel: "Licence 3",
    language: "Français",
    applicationProcedure: "Test",
    source: "https://example.fr",
    verifiedAt: "2026-01-01",
    verificationStatus: "vérifiée",
    demo: false,
    ...overrides,
  } as StudyProgram;
}

describe("buildTargetedFormations", () => {
  const fA = formation({ id: "f-a" });
  const fB = formation({ id: "f-b", institution: { name: "UCLouvain", city: "Louvain-la-Neuve", country: "Belgique" } });
  const fC = formation({ id: "f-c" });

  it("réunit sauvegardées et suivies, sans doublon pour une formation à la fois sauvegardée et suivie", () => {
    const apps: Application[] = [{ ...createApplication("f-a"), status: "prête" }];
    const targeted = buildTargetedFormations(["f-a", "f-b"], apps, [fA, fB, fC]);
    expect(targeted.map((t) => t.formation.id).sort()).toEqual(["f-a", "f-b"]);
    const a = targeted.find((t) => t.formation.id === "f-a")!;
    expect(a.saved).toBe(true);
    expect(a.application?.status).toBe("prête");
    const b = targeted.find((t) => t.formation.id === "f-b")!;
    expect(b.saved).toBe(true);
    expect(b.application).toBeUndefined();
  });

  it("inclut une formation suivie mais pas sauvegardée", () => {
    const apps: Application[] = [createApplication("f-c")];
    const targeted = buildTargetedFormations([], apps, [fA, fB, fC]);
    expect(targeted).toHaveLength(1);
    expect(targeted[0].formation.id).toBe("f-c");
    expect(targeted[0].saved).toBe(false);
  });

  it("ignore un id sauvegardé/suivi dont la formation n'existe plus au catalogue", () => {
    const targeted = buildTargetedFormations(["f-gone"], [createApplication("f-also-gone")], [fA]);
    expect(targeted).toEqual([]);
  });

  it("retourne un tableau vide sans rien de sauvegardé ni suivi", () => {
    expect(buildTargetedFormations([], [], [fA, fB, fC])).toEqual([]);
  });
});

describe("summarizeStudyProject", () => {
  it("compte les formations par pays et par objectif", () => {
    const targeted = buildTargetedFormations(
      ["f-a", "f-b"],
      [],
      [
        formation({ id: "f-a", goal: "Master", institution: { name: "A", city: "Paris", country: "France" } }),
        formation({ id: "f-b", goal: "Licence", institution: { name: "B", city: "Louvain-la-Neuve", country: "Belgique" } }),
      ],
    );
    const summary = summarizeStudyProject(targeted);
    expect(summary.totalFormations).toBe(2);
    expect(summary.countryCounts).toEqual({ France: 1, Belgique: 1 });
    expect(summary.goalCounts).toEqual({ Master: 1, Licence: 1 });
  });

  it("agrège les documents (pas les prochaines actions) de toutes les candidatures suivies", () => {
    const app: Application = {
      ...createApplication("f-a"),
      documents: [
        { id: "d1", label: "CV", done: true, required: true },
        { id: "d2", label: "Lettre", done: false, required: true },
        { id: "d3", label: "Photo", done: false, required: false },
      ],
      nextActions: [{ id: "n1", label: "Appeler le secrétariat", done: false }],
    };
    const targeted = buildTargetedFormations([], [app], [formation({ id: "f-a" })]);
    const summary = summarizeStudyProject(targeted);
    expect(summary.documentsTotal).toBe(3);
    expect(summary.documentsDone).toBe(1);
    expect(summary.requiredDocumentsPending).toBe(1); // seule "Lettre" est obligatoire et non cochée
  });

  it("reste à zéro sans aucune formation ciblée", () => {
    const summary = summarizeStudyProject([]);
    expect(summary).toEqual({
      totalFormations: 0,
      countryCounts: {},
      goalCounts: {},
      documentsTotal: 0,
      documentsDone: 0,
      requiredDocumentsPending: 0,
    });
  });
});
