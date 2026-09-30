import { ACADEMIC_LEVELS } from "@/data/subjects";
import type { AcademicLevel } from "@/types";

/**
 * Import du relevé de notes — prompt, schéma de sortie et validation (pur,
 * testable sans appel à l'API).
 *
 * Principes, dans l'ordre d'importance :
 * 1. Ne rien inventer : seules les matières lisibles sur le document sont
 *    extraites ; ce qui est illisible est signalé, jamais deviné.
 * 2. Minimisation des données (RGPD) : aucun identifiant personnel (nom,
 *    numéro étudiant, date de naissance, adresse) n'est demandé ni renvoyé.
 * 3. L'étudiant valide tout : cette extraction n'est qu'une proposition,
 *    revue ligne par ligne avant d'entrer dans le profil.
 * 4. Parler le vocabulaire du moteur : quand une matière du relevé est
 *    réellement la même qu'un intitulé du catalogue, on reprend cet
 *    intitulé (le matching devient exact) ; sinon on garde un intitulé
 *    fidèle en français — jamais de rapprochement forcé.
 */

/** Taille maximale acceptée par la route (reste sous la limite de corps de requête de Vercel, 4,5 Mo). */
export const MAX_TRANSCRIPT_BYTES = 4 * 1024 * 1024;

export const ACCEPTED_TRANSCRIPT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export type TranscriptMediaType = (typeof ACCEPTED_TRANSCRIPT_TYPES)[number];

export function isAcceptedTranscriptType(type: string): type is TranscriptMediaType {
  return (ACCEPTED_TRANSCRIPT_TYPES as readonly string[]).includes(type);
}

/** Plafond de matières renvoyées (un relevé de licence complet en compte rarement plus). */
export const MAX_EXTRACTED_COURSES = 80;

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });

/** Schéma imposé à la réponse (sorties structurées : JSON garanti conforme). */
export const TRANSCRIPT_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["is_transcript", "level_hint", "grading_scale", "average_on_20", "courses", "warnings"],
  properties: {
    is_transcript: {
      type: "boolean",
      description: "true si le document est bien un relevé de notes ou un bulletin académique.",
    },
    level_hint: nullable({ type: "string", enum: [...ACADEMIC_LEVELS] }),
    grading_scale: nullable({ type: "string", description: "Barème lu sur le document, ex: « /20 », « GPA /4 », « % »." }),
    average_on_20: nullable({
      type: "number",
      description: "Moyenne générale ramenée sur 20 si elle figure sur le document, sinon null.",
    }),
    courses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "original_name", "grade"],
        properties: {
          name: { type: "string", description: "Intitulé retenu, en français." },
          original_name: { type: "string", description: "Intitulé exactement tel qu'écrit sur le document." },
          grade: nullable({ type: "string", description: "Note telle qu'écrite (ex: « 14,5/20 », « A- »), sinon null." }),
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

export function buildTranscriptSystemPrompt(catalogueVocabulary: string[]): string {
  return [
    "Tu lis le relevé de notes d'un étudiant pour AcadMatch, une plateforme qui l'aide à trouver des formations compatibles en France et en Belgique.",
    "",
    "Règles strictes :",
    "- N'extrais QUE ce qui est lisible sur le document. N'invente jamais une matière, une note ou un niveau. Si une partie est illisible, signale-la dans « warnings » au lieu de deviner.",
    "- N'extrais AUCUNE donnée personnelle : ni nom, ni prénom, ni numéro d'étudiant, ni date de naissance, ni adresse. Ne les recopie pas non plus dans « warnings ».",
    "- Une ligne = une matière ou un module réellement suivi. Ignore les totaux, moyennes de semestre, en-têtes d'unités d'enseignement qui ne sont pas des cours, stages sans contenu académique et lignes administratives.",
    "- « original_name » : l'intitulé exactement tel qu'écrit (y compris abréviations et langue d'origine).",
    "- « name » : un intitulé clair en français, pensé pour être comparé aux formations. Si la matière porte sur le même sujet principal qu'un intitulé de la liste de référence ci-dessous, reprends cet intitulé exact, même si le relevé est plus détaillé (ex: « Thermodyn. chimique » → « Thermodynamique », « Spectro. RMN / IR » → « Spectroscopie »). Ne rapproche jamais deux sujets différents, et ne remplace jamais un sujet par un terme qui décrit seulement un format de cours (travaux pratiques, projet, stage, séminaire) : nomme alors le sujet (ex: « TP synthèse organique » → « Synthèse organique »). Sans intitulé de référence équivalent, traduis ou développe fidèlement l'intitulé d'origine (ex: « Méth. num. » → « Méthodes numériques »).",
    "- « level_hint » : le niveau d'études atteint ou en cours d'après le document (ex: un relevé de 2e année de licence → « Licence 2 »), ou null si le document ne permet pas de le savoir.",
    "- « average_on_20 » : la moyenne générale seulement si elle figure sur le document, convertie sur 20 si le barème est différent (sinon null). Ne la calcule pas toi-même.",
    "- Si le document n'est pas un relevé de notes ou un bulletin académique, mets « is_transcript » à false et laisse « courses » vide.",
    "",
    "Liste de référence (intitulés reconnus par AcadMatch) :",
    catalogueVocabulary.join(" ; "),
  ].join("\n");
}

export const TRANSCRIPT_USER_INSTRUCTION =
  "Voici mon relevé de notes. Extrais les matières suivies selon les règles, sans aucune donnée personnelle.";

export interface ExtractedCourse {
  name: string;
  originalName: string;
  grade: string | null;
}

export interface TranscriptExtraction {
  isTranscript: boolean;
  levelHint: AcademicLevel | null;
  gradingScale: string | null;
  averageOn20: number | null;
  courses: ExtractedCourse[];
  warnings: string[];
}

const MAX_TEXT = 160;
const clip = (value: string) => value.trim().slice(0, MAX_TEXT);
const isString = (value: unknown): value is string => typeof value === "string";

/**
 * Valide et normalise la réponse du modèle. Les sorties structurées
 * garantissent déjà la forme, mais la route ne fait jamais confiance
 * aveuglément à une entrée : valeurs bornées, doublons retirés, niveau
 * vérifié contre la liste officielle. null si la réponse est inutilisable.
 */
export function parseTranscriptExtraction(raw: string): TranscriptExtraction | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.is_transcript !== "boolean" || !Array.isArray(d.courses)) return null;

  const seen = new Set<string>();
  const courses: ExtractedCourse[] = [];
  for (const entry of d.courses) {
    if (!entry || typeof entry !== "object") continue;
    const c = entry as Record<string, unknown>;
    if (!isString(c.name) || !c.name.trim()) continue;
    const name = clip(c.name);
    const key = name.toLocaleLowerCase("fr");
    if (seen.has(key)) continue;
    seen.add(key);
    courses.push({
      name,
      originalName: isString(c.original_name) && c.original_name.trim() ? clip(c.original_name) : name,
      grade: isString(c.grade) && c.grade.trim() ? clip(c.grade) : null,
    });
    if (courses.length >= MAX_EXTRACTED_COURSES) break;
  }

  const level = isString(d.level_hint) && (ACADEMIC_LEVELS as string[]).includes(d.level_hint)
    ? (d.level_hint as AcademicLevel)
    : null;
  const average =
    typeof d.average_on_20 === "number" && Number.isFinite(d.average_on_20) && d.average_on_20 >= 0 && d.average_on_20 <= 20
      ? Math.round(d.average_on_20 * 10) / 10
      : null;

  return {
    isTranscript: d.is_transcript,
    levelHint: level,
    gradingScale: isString(d.grading_scale) && d.grading_scale.trim() ? clip(d.grading_scale) : null,
    averageOn20: average,
    courses: d.is_transcript ? courses : [],
    warnings: Array.isArray(d.warnings) ? d.warnings.filter(isString).map(clip).slice(0, 5) : [],
  };
}

/** Seuils des mentions : voir lib/profile/grades.ts (source unique). */
export { standingFromAverage } from "@/lib/profile/grades";
