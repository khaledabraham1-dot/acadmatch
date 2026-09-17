import { describe, expect, it } from "vitest";
import { buildFeedbackMailto, FEEDBACK_LABELS } from "@/lib/feedback";
import type { FeedbackEntry } from "@/lib/feedback";

describe("feedback MVP", () => {
  it("expose les trois niveaux d'aide", () => {
    expect(Object.keys(FEEDBACK_LABELS)).toEqual(["oui", "partiellement", "non"]);
  });

  it("ne construit pas de mailto sans e-mail configuré", () => {
    const entry: FeedbackEntry = {
      id: "fb-1",
      createdAt: "2026-09-17T00:00:00.000Z",
      helpfulness: "oui",
      comment: "Clair",
      formationId: "f-m2ds-ip-paris",
      score: 78,
    };
    // En test Vitest, NEXT_PUBLIC_FEEDBACK_EMAIL n'est en général pas défini.
    const mailto = buildFeedbackMailto(entry);
    if (!process.env.NEXT_PUBLIC_FEEDBACK_EMAIL) {
      expect(mailto).toBeNull();
    } else {
      expect(mailto).toMatch(/^mailto:/);
    }
  });
});
