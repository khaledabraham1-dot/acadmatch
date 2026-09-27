import type { Importance, StudyProgram } from "@/types";
import { domainEquivalents } from "@/data/subjects";
import { normalize } from "@/lib/utils";

/**
 * Suggestions de matières et compétences du formulaire de profil, tirées du
 * catalogue lui-même plutôt que d'une petite liste écrite à la main : un
 * étudiant voit ainsi exactement le vocabulaire que le moteur de matching
 * reconnaît, ce qui rend son score plus juste.
 *
 * Règle clé pour les MATIÈRES : on suggère ce que l'étudiant a pu étudier,
 * pas ce qu'il vise. Les matières d'un master (ex: "Physique de la matière
 * condensée") décrivent un contenu futur ; les suggérer pousserait à cocher
 * des cours jamais suivis et fausserait le score. Sources retenues : les
 * matières des LICENCES du domaine, et les matières que les formations
 * accessibles à ce domaine exigent explicitement en prérequis. Les
 * COMPÉTENCES, elles, viennent de toutes les formations du domaine.
 */

const IMPORTANCE_POINTS: Record<Importance, number> = { essentielle: 3, importante: 2, utile: 1 };
/** Une matière exigée en prérequis compte comme une matière essentielle. */
const PREREQUISITE_POINTS = 3;
/** Les suggestions écrites à la main restent en tête : elles couvrent l'essentiel de chaque domaine. */
const CURATED_POINTS = 100;

/** La formation accepte-t-elle ce domaine d'études (champ principal, ou domaine exigé / alias) ? */
function acceptsDomain(formation: StudyProgram, fieldOfStudy: string): boolean {
  const fields = domainEquivalents(fieldOfStudy).map(normalize);
  if (fields.includes(normalize(formation.field))) return true;
  return formation.prerequisites.some(
    (r) => r.type === "domaine" && [r.value, ...(r.aliases ?? [])].some((d) => fields.includes(normalize(d))),
  );
}

function rank(scores: Map<string, { label: string; points: number }>): string[] {
  return [...scores.values()]
    .sort((a, b) => b.points - a.points || a.label.localeCompare(b.label, "fr"))
    .map((entry) => entry.label);
}

function add(scores: Map<string, { label: string; points: number }>, label: string, points: number) {
  const key = normalize(label);
  if (!key) return;
  const existing = scores.get(key);
  // On garde le premier libellé rencontré (liste écrite à la main d'abord).
  if (existing) existing.points += points;
  else scores.set(key, { label, points });
}

export function suggestedCourses(formations: StudyProgram[], fieldOfStudy: string, curated: string[]): string[] {
  const scores = new Map<string, { label: string; points: number }>();
  curated.forEach((label) => add(scores, label, CURATED_POINTS));
  for (const formation of formations) {
    if (!acceptsDomain(formation, fieldOfStudy)) continue;
    if (formation.goal === "Licence" && normalize(formation.field) === normalize(fieldOfStudy)) {
      formation.coreCourses.forEach((c) => add(scores, c.name, IMPORTANCE_POINTS[c.importance]));
    }
    formation.prerequisites
      .filter((r) => r.type === "matiere")
      .forEach((r) => add(scores, r.value, PREREQUISITE_POINTS));
  }
  return rank(scores);
}

export function suggestedSkills(formations: StudyProgram[], fieldOfStudy: string, curated: string[]): string[] {
  const scores = new Map<string, { label: string; points: number }>();
  curated.forEach((label) => add(scores, label, CURATED_POINTS));
  for (const formation of formations) {
    if (!acceptsDomain(formation, fieldOfStudy)) continue;
    formation.skills.forEach((s) => add(scores, s.name, IMPORTANCE_POINTS[s.importance]));
    formation.prerequisites
      .filter((r) => r.type === "competence")
      .forEach((r) => add(scores, r.value, PREREQUISITE_POINTS));
  }
  return rank(scores);
}

/** Tout le vocabulaire reconnu par le catalogue, pour l'autocomplétion à la frappe (tous domaines). */
export function catalogueVocabulary(formations: StudyProgram[], category: "matiere" | "competence"): string[] {
  const labels = new Map<string, string>();
  for (const formation of formations) {
    const items = category === "matiere" ? formation.coreCourses : formation.skills;
    for (const item of items) {
      for (const label of [item.name, ...(item.aliases ?? [])]) {
        if (!labels.has(normalize(label))) labels.set(normalize(label), label);
      }
    }
    formation.prerequisites
      .filter((r) => r.type === category)
      .forEach((r) => {
        if (!labels.has(normalize(r.value))) labels.set(normalize(r.value), r.value);
      });
  }
  return [...labels.values()].sort((a, b) => a.localeCompare(b, "fr"));
}
