/**
 * Import du programme de formation (descriptif des enseignements, syllabus,
 * supplément au diplôme) — prompt, schéma de sortie et validation (pur,
 * testable sans appel à l'API).
 *
 * Complément du relevé de notes (lib/ai/transcriptPrompt.ts), pas un
 * remplaçant : le relevé prouve ce que l'étudiant a SUIVI, le programme dit
 * ce que chaque cours CONTENAIT. C'est la lecture que fait un jury avec un
 * diplôme étranger : l'intitulé « Analyse numérique » ne dit pas si le
 * cours comportait de la programmation, son descriptif oui.
 *
 * Principes, dans l'ordre d'importance :
 * 1. Ne rien inventer : une compétence n'est retenue que si le DESCRIPTIF du
 *    cours la mentionne — jamais déduite du seul intitulé.
 * 2. Seuls les cours réellement suivis comptent : un programme liste aussi
 *    les options non choisies. Chaque module est rapproché des matières déjà
 *    dans le profil (issues du relevé) ; les autres ne sont proposés que
 *    décochés, à confirmer par l'étudiant.
 * 3. Minimisation des données (RGPD) : aucune donnée personnelle demandée ni
 *    renvoyée — même règle que le relevé.
 * 4. Parler le vocabulaire du moteur : compétences et intitulés reprennent le
 *    libellé exact du catalogue quand le sujet est le même, sans rapprochement forcé.
 */

/** Texte collé : un descriptif de plusieurs dizaines de cours tient largement dans cette limite. */
export const MAX_SYLLABUS_TEXT_CHARS = 40_000;
export const MAX_SYLLABUS_MODULES = 60;
export const MAX_SKILLS_PER_MODULE = 6;
/** Matières du profil transmises pour le rapprochement (un relevé complet en compte rarement plus). */
export const MAX_PROFILE_COURSES = 80;

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });

/** Schéma imposé à la réponse (sorties structurées : JSON garanti conforme). */
export const SYLLABUS_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["is_syllabus", "modules", "warnings"],
  properties: {
    is_syllabus: {
      type: "boolean",
      description:
        "true si le document décrit ou liste les cours d'un cursus (programme, syllabus, descriptif des enseignements, maquette même réduite aux seuls intitulés, supplément au diplôme).",
    },
    modules: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "original_name", "matched_course", "skills", "evidence"],
        properties: {
          name: { type: "string", description: "Intitulé retenu, en français." },
          original_name: { type: "string", description: "Intitulé exactement tel qu'écrit sur le document." },
          matched_course: nullable({
            type: "string",
            description: "Matière de la liste de l'étudiant correspondant à ce cours, recopiée à l'identique, sinon null.",
          }),
          skills: {
            type: "array",
            items: { type: "string" },
            description: "Compétences ou connaissances explicitement mentionnées dans le descriptif du cours.",
          },
          evidence: {
            type: "string",
            description: "Extrait court (une phrase) du descriptif qui justifie ces compétences, en français.",
          },
        },
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Parties illisibles ou ambiguës, en français, sans donnée personnelle.",
    },
  },
} as const;

export function buildSyllabusSystemPrompt(courseVocabulary: string[], skillVocabulary: string[]): string {
  return [
    "Tu lis le programme de formation d'un étudiant (descriptif des enseignements, syllabus ou supplément au diplôme) pour AcadMatch, une plateforme qui l'aide à trouver des formations compatibles en France et en Belgique.",
    "",
    "Règles strictes :",
    "- N'extrais QUE ce qui est écrit sur le document. N'invente jamais un cours ni une compétence. Si une partie est illisible, signale-la dans « warnings » au lieu de deviner.",
    "- N'extrais AUCUNE donnée personnelle (nom, numéro d'étudiant, date de naissance, adresse), ni dans les cours, ni dans « evidence », ni dans « warnings ». Les noms d'enseignants sont aussi à ignorer.",
    "- Une entrée de « modules » = un cours ou module. Ignore les totaux, les règles d'évaluation, les stages sans contenu académique décrit et les lignes administratives.",
    "- « original_name » : l'intitulé exactement tel qu'écrit. « name » : un intitulé clair en français ; si le cours porte sur le même sujet principal qu'un intitulé de la liste de référence des matières, reprends cet intitulé exact, sinon traduis ou développe fidèlement l'intitulé d'origine.",
    `- « skills » : au plus ${MAX_SKILLS_PER_MODULE} compétences ou connaissances que le DESCRIPTIF du cours mentionne explicitement (contenu, objectifs, acquis d'apprentissage, outils utilisés). Ne déduis jamais une compétence du seul intitulé : un cours sans descriptif a « skills » vide. Si une compétence est la même qu'un intitulé de la liste de référence des compétences ou des matières, reprends cet intitulé exact (ex : « programmation en langage C » → « C » si « C » est dans la liste) ; sinon, un libellé court et fidèle en français. Reste au niveau d'un thème, d'un outil ou d'un langage, pas chaque notion du cours : « Méthodes numériques » plutôt que « Interpolation polynomiale », « Réseaux informatiques » plutôt que « Adressage IPv4 ». Libellés de 1 à 4 mots, sans parenthèses. Pas de qualités vagues (« rigueur », « autonomie ») sauf si le descriptif en fait un objectif explicite.`,
    "- « matched_course » : si ce cours est le même qu'une matière de la liste fournie par l'étudiant (même sujet, malgré une abréviation, une traduction ou une formulation différente), recopie cette matière EXACTEMENT comme elle est écrite dans la liste ; sinon null. Ne rapproche jamais deux cours différents : en cas de doute, null.",
    "- « evidence » : une phrase courte, fidèle au descriptif, qui montre d'où viennent les compétences (vide si « skills » est vide).",
    "- Une maquette qui ne donne QUE les intitulés des cours (sans descriptif), même sur plusieurs années, est un programme valide : mets « is_syllabus » à true, extrais chaque cours, et laisse « skills » vide pour tous (aucune compétence ne se déduit d'un intitulé).",
    "- Si le document ne liste aucun cours d'un cursus (ex : attestation, lettre, CV), mets « is_syllabus » à false et laisse « modules » vide.",
    "",
    "Liste de référence des matières (intitulés reconnus par AcadMatch) :",
    courseVocabulary.join(" ; "),
    "",
    "Liste de référence des compétences (intitulés reconnus par AcadMatch) :",
    skillVocabulary.join(" ; "),
  ].join("\n");
}

/** Consigne utilisateur : la liste des matières du profil sert au rapprochement cours suivis / options. */
export function buildSyllabusUserInstruction(profileCourses: string[]): string {
  const list = profileCourses.length > 0 ? profileCourses.map((c) => `- ${c}`).join("\n") : "(aucune matière renseignée)";
  return [
    "Voici le programme de ma formation. Extrais les cours et les compétences décrites selon les règles, sans aucune donnée personnelle.",
    "",
    "Matières déjà présentes dans mon profil (issues de mon relevé de notes) :",
    list,
  ].join("\n");
}

/** Valide la liste de matières envoyée par le navigateur (jamais digne de confiance). */
export function sanitizeProfileCourses(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const courses: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") continue;
    const course = clip(value);
    const key = course.toLocaleLowerCase("fr");
    if (!course || seen.has(key)) continue;
    seen.add(key);
    courses.push(course);
    if (courses.length >= MAX_PROFILE_COURSES) break;
  }
  return courses;
}

export interface ExtractedModule {
  name: string;
  originalName: string;
  /** Matière du profil correspondante (libellé exact du profil), ou null : option possiblement non suivie. */
  matchedCourse: string | null;
  skills: string[];
  evidence: string;
}

export interface SyllabusExtraction {
  isSyllabus: boolean;
  modules: ExtractedModule[];
  warnings: string[];
}

const MAX_TEXT = 160;
const MAX_EVIDENCE = 240;
const clip = (value: string, max = MAX_TEXT) => value.trim().slice(0, max);
const isString = (value: unknown): value is string => typeof value === "string";

/**
 * Valide et normalise la réponse du modèle : valeurs bornées, doublons
 * retirés, et surtout `matchedCourse` vérifié contre la liste réellement
 * envoyée — un rapprochement vers une matière absente du profil ferait
 * pré-cocher une option jamais suivie. null si la réponse est inutilisable.
 */
export function parseSyllabusExtraction(raw: string, profileCourses: string[]): SyllabusExtraction | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.is_syllabus !== "boolean" || !Array.isArray(d.modules)) return null;

  const knownCourses = new Map(profileCourses.map((c) => [c.toLocaleLowerCase("fr"), c]));
  const seen = new Set<string>();
  const modules: ExtractedModule[] = [];
  for (const entry of d.modules) {
    if (!entry || typeof entry !== "object") continue;
    const m = entry as Record<string, unknown>;
    if (!isString(m.name) || !m.name.trim()) continue;
    const name = clip(m.name);
    const key = name.toLocaleLowerCase("fr");
    if (seen.has(key)) continue;
    seen.add(key);

    const skillKeys = new Set<string>();
    const skills: string[] = [];
    for (const s of Array.isArray(m.skills) ? m.skills : []) {
      if (!isString(s) || !s.trim()) continue;
      const skill = clip(s);
      if (skillKeys.has(skill.toLocaleLowerCase("fr"))) continue;
      skillKeys.add(skill.toLocaleLowerCase("fr"));
      skills.push(skill);
      if (skills.length >= MAX_SKILLS_PER_MODULE) break;
    }

    const matched = isString(m.matched_course) ? knownCourses.get(m.matched_course.trim().toLocaleLowerCase("fr")) : undefined;
    modules.push({
      name,
      originalName: isString(m.original_name) && m.original_name.trim() ? clip(m.original_name) : name,
      matchedCourse: matched ?? null,
      skills,
      evidence: skills.length > 0 && isString(m.evidence) ? clip(m.evidence, MAX_EVIDENCE) : "",
    });
    if (modules.length >= MAX_SYLLABUS_MODULES) break;
  }

  return {
    isSyllabus: d.is_syllabus,
    modules: d.is_syllabus ? modules : [],
    warnings: Array.isArray(d.warnings) ? d.warnings.filter(isString).map((w) => clip(w)).slice(0, 5) : [],
  };
}

/**
 * Compétences issues des cours que l'étudiant a cochés comme suivis, avec
 * les cours qui les justifient — dédoublonnées sans tenir compte de la casse.
 */
export function skillsFromModules(modules: ExtractedModule[]): { skill: string; from: string[] }[] {
  const bySkill = new Map<string, { skill: string; from: string[] }>();
  for (const entry of modules) {
    for (const skill of entry.skills) {
      const key = skill.toLocaleLowerCase("fr");
      const found = bySkill.get(key) ?? { skill, from: [] };
      if (!found.from.includes(entry.name)) found.from.push(entry.name);
      bySkill.set(key, found);
    }
  }
  return [...bySkill.values()];
}
