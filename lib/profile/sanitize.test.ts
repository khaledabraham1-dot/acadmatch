import { describe, expect, it } from "vitest";
import { sanitizeProfile } from "@/lib/profile/sanitize";
import { EXAMPLE_STUDENT_PROFILE } from "@/data/example-profile";

describe("relecture d'un profil stocké", () => {
  it("garde intact un profil valide", () => {
    expect(sanitizeProfile(JSON.parse(JSON.stringify(EXAMPLE_STUDENT_PROFILE)))).toEqual(EXAMPLE_STUDENT_PROFILE);
  });

  it("ignore un profil aux champs essentiels illisibles au lieu de faire planter la page", () => {
    expect(sanitizeProfile({ currentLevel: 42, courses: "abc", skills: null, languages: {} })).toBeNull();
    expect(sanitizeProfile("texte")).toBeNull();
    expect(sanitizeProfile([1, 2])).toBeNull();
    expect(sanitizeProfile(null)).toBeNull();
  });

  it("filtre les éléments invalides et retire les champs optionnels incorrects", () => {
    const profile = sanitizeProfile({
      currentLevel: "Licence 3",
      goal: "Master",
      fieldOfStudy: "Informatique",
      courses: [{ id: "1", name: "Algorithmique" }, null, { name: 7 }, "x", { name: "Réseaux" }],
      skills: ["Python", 3, null],
      languages: [],
      academicStanding: "Génial",
      transcriptAverage: { valueOn20: 45, basis: "moyenne-generale" },
    });
    expect(profile?.courses.map((c) => c.name)).toEqual(["Algorithmique", "Réseaux"]);
    expect(profile?.courses[1].id).toBe("course-1");
    expect(profile?.skills).toEqual(["Python"]);
    expect(profile?.languages).toEqual(["Français"]);
    expect(profile?.currentDegree).toBe("");
    expect(profile).not.toHaveProperty("academicStanding");
    expect(profile).not.toHaveProperty("transcriptAverage");
  });

  it("borne les volumes extrêmes", () => {
    const profile = sanitizeProfile({
      currentLevel: "Licence 3", goal: "Master", fieldOfStudy: "Informatique",
      currentDegree: "x".repeat(50_000),
      courses: Array.from({ length: 5000 }, (_, i) => ({ id: String(i), name: `Cours ${i}` })),
    });
    expect(profile?.currentDegree).toHaveLength(2000);
    expect(profile?.courses).toHaveLength(300);
  });
});
