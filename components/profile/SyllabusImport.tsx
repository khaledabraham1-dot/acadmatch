"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, FileUp, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { aiErrorMessage, useAiAccess } from "@/components/ai/AiFeature";
import { prepareUpload } from "@/components/profile/prepareUpload";
import { ACCEPTED_TRANSCRIPT_TYPES } from "@/lib/ai/transcriptPrompt";
import {
  MAX_SYLLABUS_TEXT_CHARS,
  skillsFromModules,
  type ExtractedModule,
  type SyllabusExtraction,
} from "@/lib/ai/syllabusPrompt";

/**
 * Import du programme de formation (voir app/api/programme/route.ts) : le
 * relevé dit quels cours l'étudiant a suivis, le programme dit ce qu'ils
 * contenaient. Un cours rapproché d'une matière du profil est pré-coché ;
 * les autres (souvent des options non choisies) restent décochés, à
 * confirmer. Les compétences proposées sont celles des seuls cours cochés,
 * et rien n'entre dans le profil sans le clic de l'étudiant.
 */

const IMPORT_ERRORS: Record<string, string> = {
  unsupported_file: "Format non pris en charge : utilisez un PDF ou une photo (JPEG, PNG, WebP), ou collez le texte.",
  file_too_large: "Fichier trop lourd (4 Mo maximum) : ne gardez que les pages de votre année, ou collez le texte.",
  text_too_long: "Texte trop long : collez seulement les descriptifs des cours de votre année.",
  not_a_syllabus:
    "Ce document ne liste pas les cours d'un cursus. Il faut le programme ou la maquette de votre formation (même réduite aux intitulés des cours) — le relevé de notes s'importe au-dessus, dans « Matières ».",
  no_module_found: "Aucun cours lisible n'a été trouvé. Essayez un PDF plus net, ou collez le texte du programme.",
};

interface SyllabusImportProps {
  existingCourses: string[];
  existingSkills: string[];
  onAddCourses: (names: string[]) => void;
  onAddSkills: (names: string[]) => void;
}

const lower = (value: string) => value.toLocaleLowerCase("fr");

export function SyllabusImport({ existingCourses, existingSkills, onAddCourses, onAddSkills }: SyllabusImportProps) {
  const { configured, user, authLoading } = useAiAccess();
  const inputId = useId();
  const [mode, setMode] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<SyllabusExtraction | null>(null);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [rejectedSkills, setRejectedSkills] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<{ skills: number; courses: number } | null>(null);

  const skillInProfile = (name: string) => existingSkills.some((s) => lower(s) === lower(name));
  const courseInProfile = (name: string) => existingCourses.some((c) => lower(c) === lower(name));

  const followedModules = useMemo(
    () => extraction?.modules.filter((m) => followed.has(m.name)) ?? [],
    [extraction, followed],
  );
  const proposedSkills = useMemo(() => skillsFromModules(followedModules), [followedModules]);
  const skillsToAdd = proposedSkills.filter((s) => !skillInProfile(s.skill) && !rejectedSkills.has(lower(s.skill)));
  // Un cours suivi mais absent du profil (non rapproché du relevé) y entre aussi comme matière.
  const coursesToAdd = followedModules.filter((m) => !m.matchedCourse && !courseInProfile(m.name)).map((m) => m.name);

  const canSubmit = consent && !loading && (mode === "file" ? file !== null : text.trim().length > 0);

  async function handleAnalyze() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setExtraction(null);
    setAdded(null);
    try {
      const body = new FormData();
      body.append("courses", JSON.stringify(existingCourses));
      if (mode === "file" && file) body.append("file", await prepareUpload(file));
      else body.append("text", text);
      const response = await fetch("/api/programme", { method: "POST", body });
      const data = await response.json().catch(() => null);
      if (!data?.ok) {
        const reason: string = data?.reason ?? "error";
        setError(IMPORT_ERRORS[reason] ?? aiErrorMessage(reason));
        return;
      }
      const result = data.extraction as SyllabusExtraction;
      setExtraction(result);
      setFollowed(new Set(result.modules.filter((m) => m.matchedCourse).map((m) => m.name)));
      setRejectedSkills(new Set());
    } catch {
      setError(aiErrorMessage("error"));
    } finally {
      setLoading(false);
    }
  }

  function toggleModule(name: string) {
    setFollowed((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleSkill(skill: string) {
    setRejectedSkills((current) => {
      const next = new Set(current);
      if (next.has(lower(skill))) next.delete(lower(skill));
      else next.add(lower(skill));
      return next;
    });
  }

  function handleAdd() {
    onAddSkills(skillsToAdd.map((s) => s.skill));
    onAddCourses(coursesToAdd);
    setAdded({ skills: skillsToAdd.length, courses: coursesToAdd.length });
  }

  if (!configured) return null;

  const matchedCount = extraction?.modules.filter((m) => m.matchedCourse).length ?? 0;
  // Maquette réduite aux intitulés (cas fréquent, surtout hors de France) :
  // aucune compétence n'en est tirée, mais les cours suivis sont une vraie preuve.
  const titlesOnly = extraction !== null && extraction.modules.every((m) => m.skills.length === 0);

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <BookOpenCheck className="mt-0.5 size-5 shrink-0 text-violet-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Importer le programme de mes cours (optionnel)</p>
          <p className="mt-1 text-sm text-slate-600">
            Le descriptif de vos cours (syllabus, programme détaillé, supplément au diplôme) montre ce que chaque
            cours contenait vraiment — c&apos;est ce que lit un jury. AcadMatch en tire vos compétences, en ne
            gardant que les cours que vous avez suivis. Une simple maquette avec les intitulés des cours fonctionne
            aussi : les cours suivis rejoignent vos matières.
          </p>
          {existingCourses.length === 0 && (
            <p className="mt-2 text-sm text-violet-800">
              Conseil : importez d&apos;abord votre relevé de notes (section « Matières ») — il permet de reconnaître
              automatiquement les cours suivis parmi les options du programme.
            </p>
          )}
        </div>
      </div>

      {authLoading ? null : !user ? (
        <p className="mt-3 text-sm text-violet-800">
          <Link href="/compte?next=/profil" className="font-medium underline underline-offset-2">
            Connectez-vous
          </Link>{" "}
          (compte gratuit) pour importer votre programme — vous pouvez aussi saisir vos compétences ci-dessous.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-sm" role="group" aria-label="Type de document">
            {(["file", "text"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  setError(null);
                }}
                className={`rounded-lg px-3 py-1.5 ${mode === value ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {value === "file" ? "PDF ou photo" : "Coller le texte"}
              </button>
            ))}
          </div>

          {mode === "file" ? (
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor={inputId}
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileUp className="size-4" aria-hidden />
                {file ? "Changer de fichier" : "Choisir un PDF ou une photo"}
              </label>
              <input
                id={inputId}
                type="file"
                accept={ACCEPTED_TRANSCRIPT_TYPES.join(",")}
                className="sr-only"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError(null);
                }}
              />
              {file ? (
                <span className="truncate text-sm text-slate-600">{file.name}</span>
              ) : (
                <span className="text-xs text-slate-500">4 Mo maximum : gardez seulement les pages de votre année.</span>
              )}
            </div>
          ) : (
            <div>
              <Textarea
                aria-label="Texte du programme de formation"
                rows={6}
                maxLength={MAX_SYLLABUS_TEXT_CHARS}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Collez ici les descriptifs de vos cours (copiés depuis le site de votre université ou un PDF)…"
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {text.length.toLocaleString("fr")} / {MAX_SYLLABUS_TEXT_CHARS.toLocaleString("fr")} caractères
              </p>
            </div>
          )}

          <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <span>
              <ShieldCheck className="mr-1 inline size-3.5 text-slate-500" aria-hidden />
              J&apos;accepte que ce document soit transmis à Claude (Anthropic) uniquement pour en lire les cours.
              AcadMatch ne le conserve pas et n&apos;en extrait aucune donnée personnelle. Moins de 15 ans :
              demandez d&apos;abord l&apos;accord d&apos;un parent.{" "}
              <Link href="/confidentialite" target="_blank" className="underline underline-offset-2">
                En savoir plus
              </Link>
            </span>
          </label>

          <Button type="button" size="sm" disabled={!canSubmit} onClick={handleAnalyze}>
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BookOpenCheck className="size-4" aria-hidden />}
            {loading ? "Lecture du programme… (jusqu'à une minute)" : "Analyser mon programme"}
          </Button>

          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
      )}

      {extraction && (
        <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div>
            <p className="text-sm font-medium text-slate-900">
              1. Quels cours avez-vous suivis ? ({extraction.modules.length} lus
              {matchedCount > 0 ? `, ${matchedCount} reconnus dans vos matières` : ""})
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Les cours non reconnus sont décochés : un programme liste aussi les options que vous n&apos;avez pas
              choisies. Cochez-les seulement si vous les avez suivis.
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold">
              <button type="button" className="text-violet-700 underline underline-offset-2" onClick={() => setFollowed(new Set(extraction.modules.map((m) => m.name)))}>
                Tout cocher (j&apos;ai suivi tous ces cours)
              </button>
              <button type="button" className="text-slate-600 underline underline-offset-2" onClick={() => setFollowed(new Set())}>
                Tout décocher
              </button>
            </div>
          </div>

          <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {extraction.modules.map((item: ExtractedModule) => (
              <li key={item.name}>
                <label className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input type="checkbox" className="mt-1" checked={followed.has(item.name)} onChange={() => toggleModule(item.name)} />
                  <span className="min-w-0">
                    <span className="font-medium text-slate-800">{item.name}</span>
                    {item.matchedCourse ? (
                      <span className="ml-2 text-xs text-emerald-600">dans vos matières : {item.matchedCourse}</span>
                    ) : (
                      <span className="ml-2 text-xs text-amber-600">non reconnu dans vos matières</span>
                    )}
                    {item.skills.length > 0 ? (
                      <span className="block text-xs text-slate-500">{item.skills.join(" · ")}</span>
                    ) : (
                      <span className="block text-xs text-slate-400">Pas de descriptif : aucune compétence tirée de ce cours</span>
                    )}
                    {item.originalName !== item.name && (
                      <span className="block text-xs text-slate-400">Sur le document : {item.originalName}</span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-900">2. Compétences démontrées par ces cours</p>
            {titlesOnly ? (
              <p className="mt-1 text-sm text-slate-600">
                Ce document ne donne que les intitulés des cours : AcadMatch n&apos;en déduit aucune compétence (il ne
                les invente pas), mais chaque cours coché rejoint vos matières, ce qui renforce déjà votre profil.
              </p>
            ) : proposedSkills.length === 0 ? (
              <p className="mt-1 text-sm text-slate-500">Cochez au moins un cours suivi dont le descriptif est lisible.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {proposedSkills.map(({ skill, from }) => {
                  const inProfile = skillInProfile(skill);
                  const kept = inProfile || !rejectedSkills.has(lower(skill));
                  return (
                    <li key={skill}>
                      <label
                        title={`Vu dans : ${from.join(", ")}`}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                          kept ? "border-violet-200 bg-violet-50 text-violet-800" : "border-slate-200 bg-white text-slate-400 line-through"
                        }`}
                      >
                        <input type="checkbox" className="size-3" disabled={inProfile} checked={kept} onChange={() => toggleSkill(skill)} />
                        {skill}
                        {inProfile && <span className="text-emerald-600 no-underline">✓ déjà</span>}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {extraction.warnings.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-amber-700">
              {extraction.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            size="sm"
            className="h-auto min-h-9 py-1.5"
            disabled={skillsToAdd.length === 0 && coursesToAdd.length === 0}
            onClick={handleAdd}
          >
            Ajouter {skillsToAdd.length} compétence{skillsToAdd.length > 1 ? "s" : ""}
            {coursesToAdd.length > 0 && ` et ${coursesToAdd.length} matière${coursesToAdd.length > 1 ? "s" : ""}`} à mon profil
          </Button>
          {added && (
            <p className="text-sm text-emerald-700">
              {added.skills} compétence{added.skills > 1 ? "s" : ""}
              {added.courses > 0 && ` et ${added.courses} matière${added.courses > 1 ? "s" : ""}`} ajoutée
              {added.skills + added.courses > 1 ? "s" : ""} — pensez à enregistrer votre profil.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
