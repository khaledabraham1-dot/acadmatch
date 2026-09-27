import { describe, expect, it } from "vitest";
import {
  buildTranscriptSystemPrompt,
  isAcceptedTranscriptType,
  MAX_EXTRACTED_COURSES,
  parseTranscriptExtraction,
  standingFromAverage,
} from "@/lib/ai/transcriptPrompt";

const valid = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    is_transcript: true,
    level_hint: "Licence 2",
    grading_scale: "/20",
    average_on_20: 13.456,
    courses: [
      { name: "Méthodes numériques", original_name: "Méth. num.", grade: "14,5/20" },
      { name: "Chimie organique", original_name: "Chimie organique", grade: null },
    ],
    warnings: ["Une ligne du semestre 4 est illisible."],
    ...overrides,
  });

describe("parseTranscriptExtraction", () => {
  it("normalise une extraction valide", () => {
    const result = parseTranscriptExtraction(valid());
    expect(result).toEqual({
      isTranscript: true,
      levelHint: "Licence 2",
      gradingScale: "/20",
      averageOn20: 13.5,
      courses: [
        { name: "Méthodes numériques", originalName: "Méth. num.", grade: "14,5/20" },
        { name: "Chimie organique", originalName: "Chimie organique", grade: null },
      ],
      warnings: ["Une ligne du semestre 4 est illisible."],
    });
  });

  it("retire les doublons (casse ignorée) et les intitulés vides", () => {
    const result = parseTranscriptExtraction(
      valid({
        courses: [
          { name: "Analyse", original_name: "Analyse 1", grade: null },
          { name: "analyse", original_name: "Analyse 2", grade: null },
          { name: "  ", original_name: "x", grade: null },
        ],
      }),
    );
    expect(result?.courses.map((c) => c.name)).toEqual(["Analyse"]);
  });

  it("rejette un niveau hors de la liste officielle et une moyenne hors de 0-20", () => {
    const result = parseTranscriptExtraction(valid({ level_hint: "Bachelor 2", average_on_20: 24 }));
    expect(result?.levelHint).toBeNull();
    expect(result?.averageOn20).toBeNull();
  });

  it("ne garde aucune matière si le document n'est pas un relevé", () => {
    expect(parseTranscriptExtraction(valid({ is_transcript: false }))?.courses).toEqual([]);
  });

  it("plafonne le nombre de matières", () => {
    const courses = Array.from({ length: MAX_EXTRACTED_COURSES + 20 }, (_, i) => ({
      name: `Matière ${i}`,
      original_name: `M${i}`,
      grade: null,
    }));
    expect(parseTranscriptExtraction(valid({ courses }))?.courses).toHaveLength(MAX_EXTRACTED_COURSES);
  });

  it("renvoie null pour une réponse illisible ou mal formée", () => {
    expect(parseTranscriptExtraction("pas du json")).toBeNull();
    expect(parseTranscriptExtraction(JSON.stringify({ courses: [] }))).toBeNull();
  });
});

describe("prompt et garde-fous", () => {
  it("interdit l'invention et les données personnelles, et fournit le vocabulaire du catalogue", () => {
    const prompt = buildTranscriptSystemPrompt(["Chimie organique", "Droit des sociétés"]);
    expect(prompt).toContain("N'invente jamais");
    expect(prompt).toContain("numéro d'étudiant");
    expect(prompt).toContain("Chimie organique ; Droit des sociétés");
  });

  it("n'accepte que PDF et images lisibles par le modèle", () => {
    expect(isAcceptedTranscriptType("application/pdf")).toBe(true);
    expect(isAcceptedTranscriptType("image/jpeg")).toBe(true);
    expect(isAcceptedTranscriptType("image/heic")).toBe(false);
    expect(isAcceptedTranscriptType("application/msword")).toBe(false);
  });

  it("traduit une moyenne sur 20 en suggestion d'auto-évaluation", () => {
    expect(standingFromAverage(17)).toBe("Excellents résultats");
    expect(standingFromAverage(13.5)).toBe("Bons résultats");
    expect(standingFromAverage(11)).toBe("Résultats dans la moyenne");
    expect(standingFromAverage(8)).toBe("Résultats modestes");
  });
});
