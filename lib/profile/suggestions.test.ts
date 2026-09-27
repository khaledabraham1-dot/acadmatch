import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { DOMAINS, SUGGESTED_COURSES, SUGGESTED_SKILLS } from "@/data/subjects";
import { catalogueVocabulary, suggestedCourses, suggestedSkills } from "@/lib/profile/suggestions";
import { normalize } from "@/lib/utils";

describe("suggestions du profil tirées du catalogue", () => {
  it("chaque domaine propose nettement plus que la liste écrite à la main, sans doublon", () => {
    for (const domain of DOMAINS) {
      const courses = suggestedCourses(FORMATIONS, domain, SUGGESTED_COURSES[domain]);
      const skills = suggestedSkills(FORMATIONS, domain, SUGGESTED_SKILLS[domain]);
      expect(courses.length, domain).toBeGreaterThanOrEqual(SUGGESTED_COURSES[domain].length);
      expect(skills.length, domain).toBeGreaterThan(SUGGESTED_SKILLS[domain].length);
      expect(new Set(courses.map(normalize)).size).toBe(courses.length);
      expect(new Set(skills.map(normalize)).size).toBe(skills.length);
    }
  });

  it("garde la liste écrite à la main en tête (l'ordre interne suit la fréquence dans le catalogue)", () => {
    const curated = SUGGESTED_COURSES.Chimie;
    const head = suggestedCourses(FORMATIONS, "Chimie", curated).slice(0, curated.length);
    expect([...head].sort()).toEqual([...curated].sort());
  });

  it("ne suggère pas le contenu futur d'un master comme matière déjà étudiée", () => {
    // "Physique de la matière condensée" est une matière de master (ICFP, Lyon 1),
    // ni une matière de licence de physique, ni un prérequis explicite.
    const courses = suggestedCourses(FORMATIONS, "Physique", SUGGESTED_COURSES.Physique);
    expect(courses).not.toContain("Physique de la matière condensée");
  });

  it("un ancien domaine (« Sciences fondamentales ») reçoit les suggestions de ses remplaçants", () => {
    const legacy = suggestedSkills(FORMATIONS, "Sciences fondamentales", []);
    expect(legacy.length).toBeGreaterThan(0);
  });

  it("le vocabulaire d'autocomplétion couvre les intitulés exacts du moteur", () => {
    const vocabulary = catalogueVocabulary(FORMATIONS, "matiere");
    expect(vocabulary).toContain("Chimie organique");
    expect(vocabulary).toContain("Droit des sociétés");
    expect(new Set(vocabulary.map(normalize)).size).toBe(vocabulary.length);
  });
});
