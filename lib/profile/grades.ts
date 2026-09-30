import type { AcademicStanding, StudentProfile, TranscriptAverage } from "@/types";

/**
 * Notes réelles du relevé (2026-09-30) — logique pure, testable.
 *
 * Principe : quand l'étudiant a importé son relevé, sa moyenne RÉELLE
 * remplace son auto-évaluation dans le score (un jury regarde les notes,
 * pas ce que le candidat en dit). La moyenne n'est retenue que si le barème
 * est fiable (/20, /100 ou %) : un GPA américain ou des notes en lettres ne
 * se convertissent pas honnêtement vers /20.
 */

/** Minimum de notes lisibles pour calculer une moyenne quand le relevé n'en affiche pas. */
export const MIN_GRADES_FOR_AVERAGE = 5;

/** Barème qui se convertit linéairement et sans ambiguïté vers /20. */
export function isReliableScale(scale: string | null | undefined): boolean {
  if (!scale) return false;
  return /\/\s*20\b|\bsur\s*20\b|\/\s*100\b|%|pourcent/i.test(scale);
}

/**
 * Lit une note écrite sur un relevé et la ramène sur 20, ou null.
 * « 14,5/20 », « 14.5 », « 72/100 », « 72 % » ; `scale` (barème du
 * document) sert quand la note est écrite sans dénominateur.
 */
export function parseGradeOn20(grade: string | null | undefined, scale: string | null | undefined): number | null {
  if (!grade) return null;
  const text = grade.replace(",", ".").trim();
  const withDenominator = text.match(/^(\d{1,3}(?:\.\d+)?)\s*\/\s*(20|100)$/);
  const percent = text.match(/^(\d{1,3}(?:\.\d+)?)\s*%$/);
  const bare = text.match(/^(\d{1,3}(?:\.\d+)?)$/);

  let value: number | null = null;
  if (withDenominator) {
    const n = Number(withDenominator[1]);
    value = withDenominator[2] === "20" ? n : n / 5;
  } else if (percent) {
    value = Number(percent[1]) / 5;
  } else if (bare && isReliableScale(scale)) {
    const n = Number(bare[1]);
    value = /100|%|pourcent/i.test(scale ?? "") ? n / 5 : n;
  }
  if (value === null || !Number.isFinite(value) || value < 0 || value > 20) return null;
  return Math.round(value * 100) / 100;
}

interface ExtractionLike {
  gradingScale: string | null;
  averageOn20: number | null;
  courses: { grade: string | null }[];
}

/**
 * Moyenne retenue pour un relevé : la moyenne générale imprimée si le
 * barème est fiable, sinon la moyenne simple des notes lisibles (au moins
 * MIN_GRADES_FOR_AVERAGE), sinon null. Jamais de conversion approximative.
 */
export function transcriptAverageFrom(extraction: ExtractionLike): TranscriptAverage | null {
  if (extraction.averageOn20 !== null && isReliableScale(extraction.gradingScale)) {
    return { valueOn20: round1(extraction.averageOn20), basis: "moyenne-generale" };
  }
  const grades = extraction.courses
    .map((course) => parseGradeOn20(course.grade, extraction.gradingScale))
    .filter((grade): grade is number => grade !== null);
  if (grades.length < MIN_GRADES_FOR_AVERAGE) return null;
  const mean = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
  return { valueOn20: round1(mean), basis: "moyenne-des-notes", gradeCount: grades.length };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Seuils alignés sur les mentions officielles françaises (et les mentions
 * maghrébines, sur le même barème) : Très bien ≥ 16, Bien ≥ 14,
 * Assez bien ≥ 12, Passable ≥ 10.
 */
export function standingFromAverage(averageOn20: number): AcademicStanding {
  if (averageOn20 >= 16) return "Excellents résultats";
  if (averageOn20 >= 14) return "Bons résultats";
  if (averageOn20 >= 12) return "Résultats dans la moyenne";
  return "Résultats modestes";
}

export function mentionFor(averageOn20: number): string {
  if (averageOn20 >= 16) return "Très bien";
  if (averageOn20 >= 14) return "Bien";
  if (averageOn20 >= 12) return "Assez bien";
  if (averageOn20 >= 10) return "Passable";
  return "Insuffisant";
}

/** Moyenne du relevé exploitable (défense contre un profil local modifié à la main). */
export function validTranscriptAverage(profile: Pick<StudentProfile, "transcriptAverage">): TranscriptAverage | null {
  const average = profile.transcriptAverage;
  if (!average || typeof average.valueOn20 !== "number") return null;
  if (!Number.isFinite(average.valueOn20) || average.valueOn20 < 0 || average.valueOn20 > 20) return null;
  return average;
}

/** Résultats pris en compte par le score : le relevé s'il a été importé, sinon la déclaration. */
export function effectiveStanding(
  profile: Pick<StudentProfile, "academicStanding" | "transcriptAverage">,
): { standing: AcademicStanding | undefined; source: "relevé" | "déclaration" | null } {
  const average = validTranscriptAverage(profile);
  if (average) return { standing: standingFromAverage(average.valueOn20), source: "relevé" };
  if (profile.academicStanding) return { standing: profile.academicStanding, source: "déclaration" };
  return { standing: undefined, source: null };
}

/** « 13,4/20 (moyenne générale du relevé) » — pour l'affichage. */
export function describeAverage(average: TranscriptAverage): string {
  const value = String(average.valueOn20).replace(".", ",");
  return average.basis === "moyenne-generale"
    ? `${value}/20 (moyenne générale du relevé)`
    : `${value}/20 (moyenne simple de ${average.gradeCount} notes du relevé, sans coefficients)`;
}
