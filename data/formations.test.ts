import { describe, expect, it } from "vitest";
import { FORMATIONS, getFormationById } from "@/data/formations";
import { DOMAINS } from "@/data/subjects";
import { computeCompatibility } from "@/lib/matching/engine";
import { normalize } from "@/lib/utils";
import type { StudentProfile } from "@/types";

/** Vérifications de cohérence sur les données de démonstration (pas de logique métier ici). */
describe("FORMATIONS (catalogue réel, Étape 3 — périmètre Data Science/IA/Informatique)", () => {
  it("contient au moins 6 formations couvrant au moins 2 domaines", () => {
    expect(FORMATIONS.length).toBeGreaterThanOrEqual(6);
    const fields = new Set(FORMATIONS.map((f) => f.field));
    expect(fields.size).toBeGreaterThanOrEqual(2);
  });

  it("chaque formation réelle est vérifiée : pas de donnée démo, source officielle datée", () => {
    for (const formation of FORMATIONS) {
      expect(formation.id).toBeTruthy();
      expect(formation.coreCourses.length).toBeGreaterThan(0);
      expect(formation.skills.length).toBeGreaterThan(0);
      if (formation.demo) {
        // Une éventuelle formation de démonstration ajoutée plus tard ne doit
        // jamais avoir l'apparence d'une donnée vérifiée (voir DemoDataBadge).
        expect(formation.verifiedAt).toBeUndefined();
        expect(formation.verificationStatus).toBeUndefined();
        continue;
      }
      expect(formation.source).toMatch(/^https:\/\//);
      expect(formation.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(formation.verificationStatus).toBe("vérifiée");
    }
  });

  it("a des ids uniques", () => {
    const ids = FORMATIONS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getFormationById retrouve une formation existante et renvoie undefined sinon", () => {
    const first = FORMATIONS[0];
    expect(getFormationById(first.id)).toBe(first);
    expect(getFormationById("id-inexistant")).toBeUndefined();
  });

  it("n'a pas deux domaines dont l'un contient tous les mots de l'autre (ex: \"Sciences\" vs \"Sciences politiques\")", () => {
    // Deux domaines qui partagent tous leurs mots seraient traités par le
    // moteur comme une correspondance "forte" (voir lib/matching/engine.ts),
    // ce qui ferait passer un étudiant d'un domaine pour compatible avec
    // le prérequis "domaine" d'un tout autre domaine.
    const tokenize = (value: string) => new Set(normalize(value).split(/[^a-z0-9]+/).filter(Boolean));
    for (const a of DOMAINS) {
      for (const b of DOMAINS) {
        if (a === b) continue;
        const ta = tokenize(a);
        const tb = tokenize(b);
        const [smaller, larger] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
        const fullyContained = [...smaller].every((token) => larger.has(token));
        expect(fullyContained, `"${a}" et "${b}" ne devraient pas partager tous leurs mots`).toBe(false);
      }
    }
  });

  it("le moteur de matching produit un score valide pour chaque formation", () => {
    const profile: StudentProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Informatique",
      currentDegree: "Licence Informatique",
      courses: [{ id: "1", name: "Bases de données" }],
      skills: ["Python"],
      goal: "Master",
    };

    for (const formation of FORMATIONS) {
      const result = computeCompatibility(profile, formation);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.formationId).toBe(formation.id);
    }
  });
});
