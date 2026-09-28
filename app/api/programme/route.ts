import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { callAiStructured } from "@/lib/ai/callAi";
import { aiErrorResponse, aiFailureResponse, authenticateAiRequest } from "@/lib/ai/routeAuth";
import { isAcceptedTranscriptType, MAX_TRANSCRIPT_BYTES } from "@/lib/ai/transcriptPrompt";
import {
  buildSyllabusSystemPrompt,
  buildSyllabusUserInstruction,
  MAX_SYLLABUS_TEXT_CHARS,
  parseSyllabusExtraction,
  sanitizeProfileCourses,
  SYLLABUS_OUTPUT_SCHEMA,
} from "@/lib/ai/syllabusPrompt";
import { catalogueVocabulary } from "@/lib/profile/suggestions";
import { FORMATIONS } from "@/data/formations";

/**
 * Import du programme de formation : un fichier (PDF ou photo) ou un texte
 * collé → cours et compétences décrites, rapprochés des matières du profil
 * pour ne garder que les cours suivis. L'étudiant valide avant tout
 * enregistrement.
 *
 * Mêmes garanties que l'import du relevé (app/api/releve/route.ts) : le
 * document est lu en mémoire puis oublié — jamais écrit sur disque, en
 * base ou dans les journaux ; compte requis et un appel du quota journalier.
 */

export const maxDuration = 120;

const SYSTEM_PROMPT = buildSyllabusSystemPrompt(
  catalogueVocabulary(FORMATIONS, "matiere"),
  catalogueVocabulary(FORMATIONS, "competence"),
);

export async function POST(request: Request) {
  const auth = await authenticateAiRequest();
  if (!auth.ok) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return aiErrorResponse("invalid_request", 400);
  }

  let profileCourses: string[] = [];
  try {
    profileCourses = sanitizeProfileCourses(JSON.parse(String(form.get("courses") ?? "[]")));
  } catch {
    return aiErrorResponse("invalid_request", 400);
  }

  const file = form.get("file");
  const text = form.get("text");
  let documentBlock: Anthropic.Beta.BetaContentBlockParam;
  if (file instanceof File && file.size > 0) {
    if (!isAcceptedTranscriptType(file.type)) return aiErrorResponse("unsupported_file", 415);
    if (file.size > MAX_TRANSCRIPT_BYTES) return aiErrorResponse("file_too_large", 413);
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    documentBlock =
      file.type === "application/pdf"
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
        : { type: "image", source: { type: "base64", media_type: file.type, data } };
  } else if (typeof text === "string" && text.trim()) {
    if (text.length > MAX_SYLLABUS_TEXT_CHARS) return aiErrorResponse("text_too_long", 413);
    documentBlock = { type: "text", text: `Programme de formation (texte collé par l'étudiant) :\n\n${text.trim()}` };
  } else {
    return aiErrorResponse("invalid_request", 400);
  }

  const result = await callAiStructured({
    userId: auth.userId,
    feature: "programme-formation",
    system: SYSTEM_PROMPT,
    content: [documentBlock, { type: "text", text: buildSyllabusUserInstruction(profileCourses) }],
    schema: SYLLABUS_OUTPUT_SCHEMA,
  });
  if (!result.ok) return aiFailureResponse(result);

  const extraction = parseSyllabusExtraction(result.text, profileCourses);
  if (!extraction) return aiErrorResponse("error", 503);
  if (!extraction.isSyllabus) return aiErrorResponse("not_a_syllabus", 422);
  if (extraction.modules.length === 0) return aiErrorResponse("no_module_found", 422);
  return NextResponse.json({ ok: true, extraction });
}
