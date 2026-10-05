import type { InterviewQuestion, InterviewQuestionCategory, StudentProfile, StudyProgram } from "@/types";
import { INTERVIEW_QUESTION_CATEGORIES } from "@/types";
import { formatFormation, formatProfile } from "@/lib/ai/promptContext";

/**
 * Préparation aux entretiens (Phase 18) — logique pure (aucun appel réseau),
 * testable indépendamment de callAi. Deux prompts :
 *
 * 1. Génération de questions probables pour UNE formation, à partir du
 *    profil, de la formation, du projet d'études (autres formations
 *    ciblées) et des points faibles calculés par le moteur de matching —
 *    un jury de sélection creuse toujours les écarts entre le dossier et
 *    les prérequis, c'est là que la préparation a le plus de valeur.
 * 2. Retour sur une réponse rédigée par l'étudiant.
 *
 * Même règle non négociable que la lettre de motivation (Phase 17) : l'IA
 * n'invente jamais une expérience, compétence, diplôme ou résultat. Elle
 * ne rédige donc jamais la réponse à la place de l'étudiant — elle le
 * questionne et commente ce qu'il a lui-même écrit.
 */

export const MAX_ANSWER_LENGTH = 3000;
export const MAX_QUESTIONS = 10;
const MAX_QUESTION_LENGTH = 400;
const MAX_INTENT_LENGTH = 300;
const MAX_GAPS = 5;
const MAX_OTHER_FORMATIONS = 10;

export interface InterviewContext {
  /** Écarts calculés par lib/matching/engine.ts (`CompatibilityResult.gaps`). */
  gaps: string[];
  /** Autres formations ciblées par l'étudiant (projet d'études, Phase 16). */
  otherFormations: StudyProgram[];
}

export interface AiPrompt {
  system: string;
  user: string;
}

/**
 * Les entretiens de sélection se passent dans la langue d'enseignement : un
 * MSc enseigné en anglais fait passer son entretien en anglais. Les
 * questions suivent donc cette langue ; les explications restent en
 * français (langue de l'interface).
 */
export function interviewLanguage(formation: StudyProgram): "français" | "anglais" {
  return formation.language.toLowerCase().startsWith("angl") ? "anglais" : "français";
}

const NO_INVENTION_RULE = `Règle absolue, plus importante que tout le reste : tu n'utilises QUE les informations fournies explicitement dans le message (profil de l'étudiant, formation visée, projet d'études, écarts identifiés). Tu n'inventes JAMAIS une expérience, un stage, un projet, une compétence, un diplôme, une note ou un résultat. Un étudiant qui affirmerait en entretien une information fausse prend un risque réel.`;

const QUESTIONS_SYSTEM = `Tu es un membre expérimenté de jurys d'admission (masters, écoles, MSc) en France et en Belgique. Tu aides un étudiant à se préparer à l'entretien de sélection d'une formation précise.

${NO_INVENTION_RULE}

Génère entre 6 et 8 questions réalistes, celles qu'un jury poserait vraiment à CE candidat pour CETTE formation, réparties dans ces catégories :
- "motivation" : pourquoi cette formation, cet établissement ;
- "parcours" : son parcours réel, ses choix ;
- "académique" : les matières fondamentales et prérequis de la formation, au regard de ce qu'il a étudié ;
- "projet" : son projet professionnel ou d'études ;
- "point de vigilance" : UNIQUEMENT à partir des écarts identifiés fournis (un jury creuse toujours les faiblesses d'un dossier). S'il n'y a aucun écart, n'utilise pas cette catégorie.

Pour chaque question, "intent" explique en français, en une phrase, ce que le jury cherche à évaluer.

Réponds UNIQUEMENT avec un tableau JSON, sans texte autour ni bloc de code, au format :
[{"category": "motivation", "question": "...", "intent": "..."}]`;

const FEEDBACK_SYSTEM = `Tu es un membre expérimenté de jurys d'admission (masters, écoles, MSc) en France et en Belgique. Un étudiant s'entraîne à l'entretien de sélection d'une formation précise : tu commentes la réponse qu'il a rédigée à une question.

${NO_INVENTION_RULE}

Ne rédige JAMAIS une réponse complète à sa place. Si sa réponse mentionne un élément absent de son profil, ne l'invente pas davantage et ne le conteste pas : rappelle-lui simplement qu'il doit pouvoir le justifier devant le jury. Tu peux lui signaler des éléments RÉELS de son profil qu'il n'a pas exploités.

Sois exigeant mais bienveillant, concret et bref (120 à 220 mots). Si la question est posée en anglais, commente aussi la qualité de l'anglais.

Format : texte brut uniquement, affiché tel quel, aucun Markdown (pas de **gras**, de # titres) et jamais de tiret long (—). Utilise exactement ces trois rubriques, chacune sur sa propre ligne suivie de tirets :
Points forts :
À améliorer :
Élément de votre profil à mobiliser :`;

export function buildInterviewQuestionsPrompt(
  profile: StudentProfile,
  formation: StudyProgram,
  context: InterviewContext,
): AiPrompt {
  const gaps = context.gaps.slice(0, MAX_GAPS);
  const others = context.otherFormations
    .filter((f) => f.id !== formation.id)
    .slice(0, MAX_OTHER_FORMATIONS);

  const user = `Profil de l'étudiant :
${formatProfile(profile)}

Formation visée :
${formatFormation(formation)}
Procédure de candidature (source officielle) : ${formation.applicationProcedure}

Écarts identifiés entre le profil et la formation :
${gaps.length > 0 ? gaps.map((g) => `- ${g}`).join("\n") : "- Aucun écart identifié."}

Projet d'études, autres formations également ciblées :
${others.length > 0 ? others.map((f) => `- ${f.name} (${f.institution.name}, ${f.institution.country})`).join("\n") : "- Aucune autre formation ciblée."}

Langue des questions : ${interviewLanguage(formation)} (langue d'enseignement de la formation).

Génère les questions d'entretien. N'invente aucune information absente ci-dessus.`;

  return { system: QUESTIONS_SYSTEM, user };
}

export function buildInterviewFeedbackPrompt(
  profile: StudentProfile,
  formation: StudyProgram,
  question: string,
  answer: string,
): AiPrompt {
  const user = `Profil de l'étudiant :
${formatProfile(profile)}

Formation visée :
${formatFormation(formation)}

Question du jury : ${question.slice(0, MAX_QUESTION_LENGTH)}

Réponse rédigée par l'étudiant :
${answer.slice(0, MAX_ANSWER_LENGTH)}

Donne ton retour sur cette réponse. Ne rédige pas la réponse à sa place et n'invente aucune information.`;

  return { system: FEEDBACK_SYSTEM, user };
}

/**
 * Transforme la réponse brute du modèle en questions validées. Tolérant
 * (bloc de code, texte autour du tableau) mais strict sur le contenu :
 * toute entrée sans question exploitable est écartée plutôt que devinée.
 * Renvoie une liste vide si rien n'est exploitable — l'appelant la traite
 * comme un échec.
 */
export function parseInterviewQuestions(raw: string, makeId: () => string): InterviewQuestion[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end <= start) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const questions: InterviewQuestion[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const { category, question, intent } = item as Record<string, unknown>;
    if (typeof question !== "string" || !question.trim()) continue;
    questions.push({
      id: makeId(),
      category: normalizeCategory(category),
      question: question.trim().slice(0, MAX_QUESTION_LENGTH),
      intent: typeof intent === "string" ? intent.trim().slice(0, MAX_INTENT_LENGTH) : "",
      answer: "",
    });
    if (questions.length === MAX_QUESTIONS) break;
  }
  return questions;
}

function normalizeCategory(value: unknown): InterviewQuestionCategory {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return INTERVIEW_QUESTION_CATEGORIES.find((c) => c === normalized) ?? "parcours";
}
