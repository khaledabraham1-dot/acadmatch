"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { FileUp, Loader2, ScanText, ShieldCheck } from "lucide-react";
import type { AcademicLevel, TranscriptAverage } from "@/types";
import { describeAverage, mentionFor, transcriptAverageFrom } from "@/lib/profile/grades";
import { Button } from "@/components/ui/Button";
import { aiErrorMessage, useAiAccess } from "@/components/ai/AiFeature";
import { prepareUpload } from "@/components/profile/prepareUpload";
import {
  ACCEPTED_TRANSCRIPT_TYPES,
  type TranscriptExtraction,
} from "@/lib/ai/transcriptPrompt";

/**
 * Import du relevé de notes (voir app/api/releve/route.ts) : l'étudiant
 * choisit un PDF ou une photo, l'IA propose les matières lues, l'étudiant
 * coche ce qu'il garde : aucune matière n'entre sans son clic. La moyenne lue
 * (barème fiable) est appliquée d'office et affichée. Le
 * fichier n'est conservé nulle part.
 */

const IMPORT_ERRORS: Record<string, string> = {
  unsupported_file: "Format non pris en charge : utilisez un PDF ou une photo (JPEG, PNG, WebP).",
  file_too_large: "Fichier trop lourd (4 Mo maximum) : exportez un PDF plus léger ou prenez une photo.",
  not_a_transcript: "Ce document ne ressemble pas à un relevé de notes. Vérifiez le fichier choisi.",
  no_course_found: "Aucune matière lisible n'a été trouvée. Essayez un PDF ou une photo plus nette, bien cadrée.",
};

interface TranscriptImportProps {
  existingCourses: string[];
  currentLevel: AcademicLevel;
  onAddCourses: (names: string[]) => void;
  onApplyLevel: (level: AcademicLevel) => void;
  /** Moyenne lue sur le relevé (barème fiable) : remplace l'auto-évaluation dans le score. */
  onApplyAverage: (average: TranscriptAverage) => void;
}

export function TranscriptImport({
  existingCourses,
  currentLevel,
  onAddCourses,
  onApplyLevel,
  onApplyAverage,
}: TranscriptImportProps) {
  const { configured, user, authLoading } = useAiAccess();
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<TranscriptExtraction | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addedCount, setAddedCount] = useState<number | null>(null);

  const alreadyInProfile = (name: string) =>
    existingCourses.some((c) => c.toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr"));

  async function handleAnalyze() {
    if (!file || !consent) return;
    setLoading(true);
    setError(null);
    setExtraction(null);
    setAddedCount(null);
    try {
      const body = new FormData();
      body.append("file", await prepareUpload(file));
      const response = await fetch("/api/releve", { method: "POST", body });
      const data = await response.json().catch(() => null);
      if (!data?.ok) {
        const reason: string = data?.reason ?? "error";
        setError(IMPORT_ERRORS[reason] ?? aiErrorMessage(reason));
        return;
      }
      const result = data.extraction as TranscriptExtraction;
      setExtraction(result);
      // La moyenne est un fait lu sur le document : appliquée d'office (le
      // score se fonde sur les vraies notes), et affichée ci-dessous.
      const average = transcriptAverageFrom(result);
      if (average) onApplyAverage(average);
      setSelected(new Set(result.courses.filter((c) => !alreadyInProfile(c.name)).map((c) => c.name)));
    } catch {
      setError(aiErrorMessage("error"));
    } finally {
      setLoading(false);
    }
  }

  function toggle(name: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function handleAdd() {
    const names = extraction?.courses.map((c) => c.name).filter((n) => selected.has(n)) ?? [];
    onAddCourses(names);
    setAddedCount(names.length);
    setSelected(new Set());
  }

  if (!configured) return null;

  const average = extraction ? transcriptAverageFrom(extraction) : null;

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <ScanText className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Importer mon relevé de notes (recommandé)</p>
          <p className="mt-1 text-sm text-slate-600">
            AcadMatch lit vos matières à votre place : un profil complet donne un score bien plus fiable
            qu&apos;une saisie à la main. Vous validez chaque matière avant qu&apos;elle soit ajoutée.
          </p>
        </div>
      </div>
      <div>
        {authLoading ? null : !user ? (
          <p className="mt-3 text-sm text-blue-800">
            <Link href="/compte?next=/profil" className="font-medium underline underline-offset-2">
              Connectez-vous
            </Link>{" "}
            (compte gratuit) pour importer votre relevé — vous pouvez aussi saisir vos matières ci-dessous.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
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
              {file && <span className="truncate text-sm text-slate-600">{file.name}</span>}
            </div>

            <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <ShieldCheck className="mr-1 inline size-3.5 text-slate-500" aria-hidden />
                J&apos;accepte que ce document soit transmis à Claude (Anthropic) uniquement pour en lire les
                matières. AcadMatch ne le conserve pas et n&apos;en extrait aucune donnée personnelle (nom,
                numéro étudiant…). Moins de 15 ans : demandez d&apos;abord l&apos;accord d&apos;un parent.{" "}
                <Link href="/confidentialite" target="_blank" className="underline underline-offset-2">
                  En savoir plus
                </Link>
              </span>
            </label>

            <Button type="button" size="sm" disabled={!file || !consent || loading} onClick={handleAnalyze}>
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ScanText className="size-4" aria-hidden />}
              {loading ? "Lecture du relevé… (jusqu'à une minute)" : "Analyser mon relevé"}
            </Button>

            {error && <p className="text-sm text-red-700">{error}</p>}
          </div>
        )}

        {extraction && (
          <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-900">
                {extraction.courses.length} matière{extraction.courses.length > 1 ? "s" : ""} lue
                {extraction.courses.length > 1 ? "s" : ""} — décochez celles à ne pas garder
              </p>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => setSelected(new Set(extraction.courses.filter((c) => !alreadyInProfile(c.name)).map((c) => c.name)))}
                >
                  Tout cocher
                </button>
                <button type="button" className="text-slate-500 hover:text-slate-700" onClick={() => setSelected(new Set())}>
                  Tout décocher
                </button>
              </div>
            </div>

            <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
              {extraction.courses.map((course) => {
                const inProfile = alreadyInProfile(course.name);
                return (
                  <li key={course.name}>
                    <label className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                      <input
                        type="checkbox"
                        className="mt-1"
                        disabled={inProfile}
                        checked={inProfile || selected.has(course.name)}
                        onChange={() => toggle(course.name)}
                      />
                      <span className="min-w-0">
                        <span className="font-medium text-slate-800">{course.name}</span>
                        {course.grade && <span className="ml-2 text-xs text-slate-500">{course.grade}</span>}
                        {inProfile && <span className="ml-2 text-xs text-emerald-600">déjà dans votre profil</span>}
                        {course.originalName !== course.name && (
                          <span className="block text-xs text-slate-400">Sur le relevé : {course.originalName}</span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            {extraction.warnings.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-5 text-xs text-amber-700">
                {extraction.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" className="h-auto min-h-9 py-1.5" disabled={selected.size === 0} onClick={handleAdd}>
                Ajouter {selected.size} matière{selected.size > 1 ? "s" : ""} à mon profil
              </Button>
              {extraction.levelHint && extraction.levelHint !== currentLevel && (
                <Button type="button" size="sm" variant="outline" className="h-auto min-h-9 py-1.5" onClick={() => onApplyLevel(extraction.levelHint!)}>
                  Niveau lu : {extraction.levelHint} — l&apos;utiliser
                </Button>
              )}

            </div>
            {addedCount !== null && (
              <p className="text-sm text-emerald-700">
                {addedCount} matière{addedCount > 1 ? "s" : ""} ajoutée{addedCount > 1 ? "s" : ""} — pensez à
                enregistrer votre profil.
              </p>
            )}
            {average ? (
              <p className="rounded-xl bg-white px-3 py-2.5 text-sm text-slate-700 ring-1 ring-inset ring-blue-100">
                <strong className="font-bold text-slate-900">Moyenne retenue : {describeAverage(average)}</strong>, mention «&nbsp;
                {mentionFor(average.valueOn20)}&nbsp;». Vos résultats sont désormais évalués d&apos;après votre relevé, et
                non d&apos;après une auto-évaluation.
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Pas de moyenne exploitable sur ce relevé
                {extraction.gradingScale ? ` (barème « ${extraction.gradingScale} », non converti automatiquement vers /20)` : ""} :
                vos résultats restent ceux que vous déclarez.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
