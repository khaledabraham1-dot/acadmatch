import type { StudentProfile, StudyProgram } from "@/types";

/**
 * Mise en forme texte du profil et de la formation, partagée par toutes les
 * fonctionnalités IA (lettre de motivation — Phase 17, préparation aux
 * entretiens — Phase 18) : une seule définition de "ce que l'IA a le droit
 * de savoir sur l'étudiant", pour que la règle anti-invention s'appuie
 * partout sur exactement les mêmes informations.
 */

/** Limite de longueur des expériences déclarées envoyées à l'IA (coût + abus). */
export const MAX_EXPERIENCES_LENGTH = 2000;

export function formatProfile(profile: StudentProfile): string {
  const lines = [
    `Niveau actuel : ${profile.currentLevel}`,
    `Diplôme actuel / en cours : ${profile.currentDegree}`,
    `Domaine d'études : ${profile.fieldOfStudy}`,
    `Objectif : ${profile.goal}`,
    `Langues : ${profile.languages.join(", ")}`,
  ];
  if (profile.courses.length > 0) {
    lines.push(`Matières suivies : ${profile.courses.map((c) => c.name).join(", ")}`);
  }
  if (profile.skills.length > 0) {
    lines.push(`Compétences : ${profile.skills.join(", ")}`);
  }
  if (profile.academicStanding) {
    lines.push(`Auto-évaluation du dossier : ${profile.academicStanding}`);
  }
  const experiences = profile.experiences?.trim();
  if (experiences) {
    lines.push(`Expériences et projets déclarés par l'étudiant : ${experiences.slice(0, MAX_EXPERIENCES_LENGTH)}`);
  }
  return lines.join("\n");
}

export function formatFormation(formation: StudyProgram): string {
  const lines = [
    `Nom : ${formation.name}`,
    `Établissement : ${formation.institution.name} (${formation.institution.city}, ${formation.institution.country})`,
    `Diplôme visé : ${formation.goal}`,
    `Année d'entrée : ${formation.level} (niveau requis pour candidater : ${formation.requiredLevel})`,
    `Domaine : ${formation.field}`,
    `Langue d'enseignement : ${formation.language}`,
    `Description officielle : ${formation.description}`,
  ];
  if (formation.coreCourses.length > 0) {
    lines.push(`Matières fondamentales : ${formation.coreCourses.map((c) => c.name).join(", ")}`);
  }
  if (formation.prerequisites.length > 0) {
    lines.push(`Prérequis : ${formation.prerequisites.map((p) => p.label).join(", ")}`);
  }
  return lines.join("\n");
}

/** Au-delà, le profil reçu par une route IA est refusé (coût + abus). */
export const MAX_PROFILE_JSON_LENGTH = 20_000;

/**
 * Le profil vit dans localStorage et voyage dans le corps des requêtes IA :
 * une route serveur ne peut jamais lui faire confiance. Vérifie la forme
 * minimale que formatProfile lit (sans quoi il lèverait une exception → 500)
 * et plafonne sa taille, puisqu'il est recopié tel quel dans le prompt.
 */
export function isPromptableProfile(value: unknown): value is StudentProfile {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  const isString = (v: unknown) => typeof v === "string";
  const isStringArray = (v: unknown) => Array.isArray(v) && v.every(isString);
  return (
    isString(p.currentLevel) &&
    isString(p.currentDegree) &&
    isString(p.fieldOfStudy) &&
    isString(p.goal) &&
    isStringArray(p.languages) &&
    isStringArray(p.skills) &&
    Array.isArray(p.courses) &&
    p.courses.every((c) => c && typeof c === "object" && isString((c as { name?: unknown }).name)) &&
    (p.academicStanding === undefined || isString(p.academicStanding)) &&
    (p.experiences === undefined || isString(p.experiences)) &&
    JSON.stringify(value).length <= MAX_PROFILE_JSON_LENGTH
  );
}
