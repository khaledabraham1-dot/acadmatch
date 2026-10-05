import { ACADEMIC_STANDINGS, STUDY_GOALS } from "@/data/subjects";
import { ACADEMIC_LEVEL_ORDER, type Course, type StudentProfile } from "@/types";

/**
 * Relit un profil venu du stockage local ou de la synchronisation (audit avant
 * lancement, 2026-10-05). Ces données ne sont pas fiables : ancienne version
 * du site, stockage abîmé, édition manuelle. Avant ce contrôle, un profil aux
 * types incorrects faisait tomber la recherche, le résultat et l'espace sur
 * l'écran d'erreur.
 *
 * Règle : un profil dont les champs essentiels sont illisibles est ignoré
 * (l'étudiant le ressaisit), les listes sont filtrées élément par élément et
 * les champs optionnels invalides sont simplement retirés.
 */
const MAX_TEXT = 2000;
const MAX_ITEMS = 300;

const isText = (value: unknown): value is string => typeof value === "string";
const clip = (value: string) => value.slice(0, MAX_TEXT);

export function sanitizeProfile(raw: unknown): StudentProfile | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const p = raw as Record<string, unknown>;

  if (!(ACADEMIC_LEVEL_ORDER as unknown[]).includes(p.currentLevel)) return null;
  if (!(STUDY_GOALS as unknown[]).includes(p.goal)) return null;
  if (!isText(p.fieldOfStudy)) return null;

  const courses: Course[] = (Array.isArray(p.courses) ? p.courses : [])
    .filter((c): c is { id?: unknown; name: string } => !!c && typeof c === "object" && isText((c as { name?: unknown }).name))
    .slice(0, MAX_ITEMS)
    .map((c, index) => ({ id: isText(c.id) ? c.id : `course-${index}`, name: clip(c.name) }));
  const textList = (value: unknown) => (Array.isArray(value) ? value.filter(isText).slice(0, MAX_ITEMS).map(clip) : []);
  const languages = textList(p.languages);

  const profile: StudentProfile = {
    currentLevel: p.currentLevel as StudentProfile["currentLevel"],
    fieldOfStudy: clip(p.fieldOfStudy),
    currentDegree: isText(p.currentDegree) ? clip(p.currentDegree) : "",
    courses,
    skills: textList(p.skills),
    goal: p.goal as StudentProfile["goal"],
    // Profil antérieur à l'ajout des langues : le français par défaut (voir loadProfile).
    languages: languages.length ? languages : ["Français"],
  };
  if ((ACADEMIC_STANDINGS as unknown[]).includes(p.academicStanding)) profile.academicStanding = p.academicStanding as StudentProfile["academicStanding"];
  if (isText(p.experiences)) profile.experiences = clip(p.experiences);
  const average = p.transcriptAverage as Record<string, unknown> | undefined;
  if (
    average &&
    typeof average.valueOn20 === "number" &&
    average.valueOn20 >= 0 &&
    average.valueOn20 <= 20 &&
    (average.basis === "moyenne-generale" || average.basis === "moyenne-des-notes")
  ) {
    profile.transcriptAverage = {
      valueOn20: average.valueOn20,
      basis: average.basis,
      ...(typeof average.gradeCount === "number" ? { gradeCount: average.gradeCount } : {}),
    };
  }
  return profile;
}
