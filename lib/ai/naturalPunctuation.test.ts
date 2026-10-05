import { describe, expect, it } from "vitest";
import { naturalPunctuation } from "@/lib/ai/punctuation";

describe("ponctuation naturelle du texte généré", () => {
  it("remplace le tiret long en incise par une virgule", () => {
    expect(naturalPunctuation("Ce master — très exigeant — me correspond.")).toBe("Ce master, très exigeant, me correspond.");
  });
  it("transforme une puce en tiret simple", () => {
    expect(naturalPunctuation("Points forts :\n— clarté\n— exemples")).toBe("Points forts :\n- clarté\n- exemples");
  });
  it("laisse un texte sans tiret long intact", () => {
    expect(naturalPunctuation("Madame, Monsieur,\nJe candidate.")).toBe("Madame, Monsieur,\nJe candidate.");
  });
});
