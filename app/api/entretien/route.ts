import { NextResponse } from "next/server";
import { callAi } from "@/lib/ai/callAi";
import {
  buildInterviewFeedbackPrompt,
  buildInterviewQuestionsPrompt,
  MAX_ANSWER_LENGTH,
  parseInterviewQuestions,
} from "@/lib/ai/interviewPrompt";
import { isPromptableProfile } from "@/lib/ai/promptContext";
import { aiErrorResponse, aiFailureResponse, authenticateAiRequest, readJsonBody } from "@/lib/ai/routeAuth";
import { computeCompatibility } from "@/lib/matching/engine";
import { getFormationById } from "@/data/formations";
import type { StudentProfile, StudyProgram } from "@/types";

/**
 * Préparation aux entretiens (Phase 18) — deuxième fonctionnalité IA, même
 * fondations que la lettre de motivation (Phase 6/17, voir
 * docs/ai-integration.md). Deux actions, chacune compte pour UN appel dans
 * le quota journalier partagé :
 *
 * - "questions" : génère les questions probables pour une formation.
 * - "feedback" : commente la réponse rédigée par l'étudiant à une question.
 *
 * Tout ce qui peut l'être est recalculé ici plutôt que reçu du navigateur :
 * la formation et ses informations viennent du catalogue serveur, les
 * écarts du moteur de matching. Seuls le profil (localStorage), les ids des
 * autres formations ciblées et la réponse de l'étudiant voyagent dans la
 * requête — validés et plafonnés, jamais persistés côté serveur.
 */

const MAX_TARGETED_IDS = 30;
const MAX_QUESTION_INPUT_LENGTH = 400;

interface InterviewRequestBody {
  action: "questions" | "feedback";
  formationId: string;
  profile: unknown;
  targetedFormationIds: unknown;
  question: unknown;
  answer: unknown;
}

export async function POST(request: Request) {
  const auth = await authenticateAiRequest();
  if (!auth.ok) return auth.response;

  const body = await readJsonBody<InterviewRequestBody>(request);
  const formation = body?.formationId ? getFormationById(body.formationId) : undefined;
  if (!body || !formation || !isPromptableProfile(body.profile)) {
    return aiErrorResponse("invalid_request", 400);
  }
  const profile = body.profile;

  if (body.action === "questions") {
    const { system, user } = buildInterviewQuestionsPrompt(profile, formation, {
      gaps: safeGaps(profile, formation),
      otherFormations: resolveFormations(body.targetedFormationIds),
    });
    const result = await callAi({
      userId: auth.userId,
      feature: "entretien-questions",
      system,
      messages: [{ role: "user", content: user }],
      maxTokens: 1500,
    });
    if (!result.ok) return aiFailureResponse(result);

    const questions = parseInterviewQuestions(result.text, () => crypto.randomUUID());
    if (questions.length === 0) return aiErrorResponse("error", 503);
    return NextResponse.json({ ok: true, questions });
  }

  if (body.action === "feedback") {
    const { question, answer } = body;
    if (
      typeof question !== "string" ||
      typeof answer !== "string" ||
      !question.trim() ||
      !answer.trim() ||
      question.length > MAX_QUESTION_INPUT_LENGTH ||
      answer.length > MAX_ANSWER_LENGTH
    ) {
      return aiErrorResponse("invalid_request", 400);
    }
    const { system, user } = buildInterviewFeedbackPrompt(profile, formation, question, answer);
    const result = await callAi({
      userId: auth.userId,
      feature: "entretien-feedback",
      system,
      messages: [{ role: "user", content: user }],
      maxTokens: 800,
    });
    if (!result.ok) return aiFailureResponse(result);
    return NextResponse.json({ ok: true, text: result.text });
  }

  return aiErrorResponse("invalid_request", 400);
}

/**
 * Le moteur de matching a été écrit pour des profils issus du formulaire :
 * un profil forgé mais bien formé pourrait contenir une valeur inattendue
 * (ex: academicStanding inconnu). Les écarts ne sont qu'un enrichissement
 * du prompt — leur échec ne doit jamais faire échouer la requête.
 */
function safeGaps(profile: StudentProfile, formation: StudyProgram): string[] {
  try {
    return computeCompatibility(profile, formation).gaps;
  } catch {
    return [];
  }
}

function resolveFormations(ids: unknown): StudyProgram[] {
  if (!Array.isArray(ids)) return [];
  return ids
    .slice(0, MAX_TARGETED_IDS)
    .filter((id): id is string => typeof id === "string")
    .map((id) => getFormationById(id))
    .filter((f): f is StudyProgram => f !== undefined);
}
