import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { EXAMPLE_STUDENT_PROFILE } from "@/data/example-profile";
import { computeCompatibility } from "@/lib/matching/engine";
import {
  effectiveStanding,
  isReliableScale,
  mentionFor,
  parseGradeOn20,
  transcriptAverageFrom,
  validTranscriptAverage,
} from "./grades";

const courses = (grades: (string | null)[]) => grades.map((grade) => ({ grade }));

describe("lecture des notes", () => {
  it("ramène les notes lisibles sur 20", () => {
    expect(parseGradeOn20("14,5/20", null)).toBe(14.5);
    expect(parseGradeOn20("72/100", null)).toBe(14.4);
    expect(parseGradeOn20("65 %", null)).toBe(13);
    expect(parseGradeOn20("12.25", "/20")).toBe(12.25);
  });

  it("refuse ce qui ne se convertit pas honnêtement", () => {
    expect(parseGradeOn20("A-", "Lettres")).toBeNull();
    expect(parseGradeOn20("3.4", "GPA /4")).toBeNull();
    expect(parseGradeOn20("14", null)).toBeNull();
    expect(parseGradeOn20("25/20", null)).toBeNull();
    expect(isReliableScale("GPA /4")).toBe(false);
    expect(isReliableScale("/20")).toBe(true);
  });
});

describe("moyenne retenue pour un relevé", () => {
  it("préfère la moyenne générale imprimée quand le barème est fiable", () => {
    expect(transcriptAverageFrom({ gradingScale: "/20", averageOn20: 13.36, courses: [] })).toEqual({
      valueOn20: 13.4,
      basis: "moyenne-generale",
    });
  });

  it("sinon calcule la moyenne simple des notes lisibles, à partir de 5 notes", () => {
    const average = transcriptAverageFrom({ gradingScale: "/20", averageOn20: null, courses: courses(["12", "14", "16", "10", "13", null]) });
    expect(average).toEqual({ valueOn20: 13, basis: "moyenne-des-notes", gradeCount: 5 });
    expect(transcriptAverageFrom({ gradingScale: "/20", averageOn20: null, courses: courses(["12", "14"]) })).toBeNull();
  });

  it("ignore une moyenne « convertie » depuis un barème non fiable", () => {
    expect(transcriptAverageFrom({ gradingScale: "GPA /4", averageOn20: 15, courses: [] })).toBeNull();
  });

  it("donne la mention officielle", () => {
    expect(mentionFor(16)).toBe("Très bien");
    expect(mentionFor(12)).toBe("Assez bien");
    expect(mentionFor(9.9)).toBe("Insuffisant");
  });
});

describe("le relevé l'emporte sur la déclaration", () => {
  const mosig = FORMATIONS.find((f) => f.id === "f-mosig-grenoble-inp")!;

  it("des « excellents résultats » déclarés ne masquent pas une moyenne réelle de 10,5", () => {
    const declared = { ...EXAMPLE_STUDENT_PROFILE, academicStanding: "Excellents résultats" as const };
    const withTranscript = { ...declared, transcriptAverage: { valueOn20: 10.5, basis: "moyenne-generale" as const } };
    expect(effectiveStanding(withTranscript)).toEqual({ standing: "Résultats modestes", source: "relevé" });
    expect(computeCompatibility(withTranscript, mosig).overallScore).toBeLessThan(
      computeCompatibility(declared, mosig).overallScore - 15,
    );
  });

  it("une moyenne locale falsifiée (hors 0-20) est ignorée", () => {
    expect(validTranscriptAverage({ transcriptAverage: { valueOn20: 57, basis: "moyenne-generale" } })).toBeNull();
    expect(effectiveStanding({ academicStanding: "Bons résultats", transcriptAverage: { valueOn20: Number.NaN, basis: "moyenne-generale" } }).source).toBe("déclaration");
  });
});
