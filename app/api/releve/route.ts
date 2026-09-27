import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { callAiStructured } from "@/lib/ai/callAi";
import { aiErrorResponse, aiFailureResponse, authenticateAiRequest } from "@/lib/ai/routeAuth";
import {
  buildTranscriptSystemPrompt,
  isAcceptedTranscriptType,
  MAX_TRANSCRIPT_BYTES,
  parseTranscriptExtraction,
  TRANSCRIPT_OUTPUT_SCHEMA,
  TRANSCRIPT_USER_INSTRUCTION,
} from "@/lib/ai/transcriptPrompt";
import { catalogueVocabulary } from "@/lib/profile/suggestions";
import { FORMATIONS } from "@/data/formations";

/**
 * Import du relevé de notes : un fichier (PDF ou photo) → liste de matières
 * proposée à l'étudiant, qui valide avant tout enregistrement.
 *
 * Données personnelles : le fichier est lu en mémoire, transmis à Claude
 * pour l'analyse, puis oublié — jamais écrit sur disque, en base ou dans
 * les journaux. Seule la liste validée par l'étudiant rejoint son profil.
 * Compte requis, un appel du quota journalier partagé (comme les autres
 * fonctionnalités IA, voir docs/ai-integration.md).
 */

// Lecture d'un document par le modèle : compter jusqu'à ~1 minute.
export const maxDuration = 120;

const SYSTEM_PROMPT = buildTranscriptSystemPrompt(catalogueVocabulary(FORMATIONS, "matiere"));

export async function POST(request: Request) {
  const auth = await authenticateAiRequest();
  if (!auth.ok) return auth.response;

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return aiErrorResponse("invalid_request", 400);
  }
  if (!(file instanceof File) || file.size === 0) return aiErrorResponse("invalid_request", 400);
  if (!isAcceptedTranscriptType(file.type)) return aiErrorResponse("unsupported_file", 415);
  if (file.size > MAX_TRANSCRIPT_BYTES) return aiErrorResponse("file_too_large", 413);

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const documentBlock: Anthropic.Beta.BetaContentBlockParam =
    file.type === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : { type: "image", source: { type: "base64", media_type: file.type, data } };

  const result = await callAiStructured({
    userId: auth.userId,
    feature: "releve-notes",
    system: SYSTEM_PROMPT,
    content: [documentBlock, { type: "text", text: TRANSCRIPT_USER_INSTRUCTION }],
    schema: TRANSCRIPT_OUTPUT_SCHEMA,
  });
  if (!result.ok) return aiFailureResponse(result);

  const extraction = parseTranscriptExtraction(result.text);
  if (!extraction) return aiErrorResponse("error", 503);
  if (!extraction.isTranscript) return aiErrorResponse("not_a_transcript", 422);
  if (extraction.courses.length === 0) return aiErrorResponse("no_course_found", 422);
  return NextResponse.json({ ok: true, extraction });
}
