import type { StudentProfile } from "@/types";

/**
 * Profil exemple pour l'onboarding MVP (Étape 9).
 *
 * Objectif : qu'un visiteur comprenne AcadMatch en < 60 s sans remplir
 * tout le formulaire. Profil volontairement "solide" (L3 Info → Master)
 * pour que le ranking et le plan d'actions soient parlants.
 */
export const EXAMPLE_PROFILE_LABEL = "Exemple : L3 Informatique → Master";

export const EXAMPLE_STUDENT_PROFILE: StudentProfile = {
  currentLevel: "Licence 3",
  fieldOfStudy: "Informatique",
  currentDegree: "Licence Informatique",
  courses: [
    { id: "ex-c1", name: "Algorithmique" },
    { id: "ex-c2", name: "Bases de données" },
    { id: "ex-c3", name: "Programmation orientée objet" },
    { id: "ex-c4", name: "Statistiques" },
    { id: "ex-c5", name: "Réseaux informatiques" },
  ],
  skills: ["Python", "SQL", "Git", "Java"],
  goal: "Master",
  languages: ["Français", "Anglais"],
  academicStanding: "Bons résultats",
};
