import { describe, expect, it } from "vitest";
import { FAIRNESS_LABELS, FEEDBACK_LABELS, toFeedbackRow, type FeedbackPayload } from "@/lib/feedback";

const payload: FeedbackPayload = {
  formationId: "f-mosig-grenoble-inp",
  score: 67.4,
  helpfulness: "oui",
  scoreFairness: "trop-haut",
  comment: "  Clair  ",
  profileField: "Informatique",
  profileLevel: "Licence 3",
  scoreEstimate: false,
  fromTranscript: true,
};

describe("avis sur les résultats", () => {
  it("expose les réponses attendues par la base", () => {
    expect(Object.keys(FEEDBACK_LABELS)).toEqual(["oui", "partiellement", "non"]);
    expect(Object.keys(FAIRNESS_LABELS)).toEqual(["trop-haut", "juste", "trop-bas"]);
  });

  it("construit une ligne anonyme, bornée comme les contraintes SQL", () => {
    const row = toFeedbackRow({ ...payload, comment: "x".repeat(5000), score: 140 });
    expect(row.comment).toHaveLength(1000);
    expect(row.score).toBe(100);
    expect(Object.keys(row)).not.toContain("email");
    expect(Object.keys(row)).not.toContain("user_id");
  });

  it("nettoie le commentaire et arrondit le score", () => {
    const row = toFeedbackRow(payload);
    expect(row.comment).toBe("Clair");
    expect(row.score).toBe(67);
    expect(row.from_transcript).toBe(true);
  });
});
