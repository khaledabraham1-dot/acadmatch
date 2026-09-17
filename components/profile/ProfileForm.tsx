"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AcademicLevel, StudentProfile, StudyGoal } from "@/types";
import {
  ACADEMIC_LEVELS,
  CURRENT_DEGREE_SUGGESTIONS,
  DOMAINS,
  STUDY_GOALS,
  SUGGESTED_COURSES,
  SUGGESTED_SKILLS,
  TEACHING_LANGUAGES,
  type Domain,
} from "@/data/subjects";
import { clearProfile, loadProfile, saveProfile } from "@/lib/storage";
import {
  RECOMMENDED_COURSES,
  RECOMMENDED_SKILLS,
  safeInternalPath,
  validateProfileDraft,
} from "@/lib/profile/validation";
import { generateId } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Label, Select, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { CourseSkillEditor } from "@/components/profile/CourseSkillEditor";
import { ProfileReliabilityNotice } from "@/components/profile/ProfileReliabilityNotice";
import { ArrowRight } from "lucide-react";

const DEFAULT_DOMAIN: Domain = "Informatique";

export function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentLevel, setCurrentLevel] = useState<AcademicLevel>("Licence 3");
  const [fieldOfStudy, setFieldOfStudy] = useState<Domain>(DEFAULT_DOMAIN);
  const [currentDegree, setCurrentDegree] = useState("");
  const [courses, setCourses] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [goal, setGoal] = useState<StudyGoal>("Master");
  const [languages, setLanguages] = useState<string[]>(["Français"]);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Pré-remplit le formulaire si un profil existe déjà (édition, retour en arrière).
  useEffect(() => {
    const existing = loadProfile();
    if (!existing) return;
    // localStorage n'existe pas côté serveur : on ne peut hydrater le formulaire qu'après le montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentLevel(existing.currentLevel);
    setFieldOfStudy((existing.fieldOfStudy as Domain) ?? DEFAULT_DOMAIN);
    setCurrentDegree(existing.currentDegree);
    setCourses(existing.courses.map((c) => c.name));
    setSkills(existing.skills);
    setGoal(existing.goal);
    setLanguages(existing.languages ?? ["Français"]);
    setHasExistingProfile(true);
  }, []);

  const validation = useMemo(
    () =>
      validateProfileDraft({
        currentLevel,
        fieldOfStudy,
        currentDegree,
        courses,
        skills,
        goal,
        languages,
      }),
    [currentLevel, fieldOfStudy, currentDegree, courses, skills, goal, languages],
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!validation.isSubmittable) return;

    const profile: StudentProfile = {
      currentLevel,
      fieldOfStudy,
      currentDegree: currentDegree.trim() || `${currentLevel} — ${fieldOfStudy}`,
      courses: courses.map((name) => ({ id: generateId("course"), name })),
      skills,
      goal,
      languages,
    };

    saveProfile(profile);
    setHasExistingProfile(true);

    const next = safeInternalPath(searchParams.get("next"));
    router.push(next);
  }

  function handleClear() {
    clearProfile();
    setCurrentLevel("Licence 3");
    setFieldOfStudy(DEFAULT_DOMAIN);
    setCurrentDegree("");
    setCourses([]);
    setSkills([]);
    setGoal("Master");
    setLanguages(["Français"]);
    setHasExistingProfile(false);
    setSubmitAttempted(false);
  }

  function toggleLanguage(lang: string, checked: boolean) {
    if (checked) {
      setLanguages((prev) => (prev.includes(lang) ? prev : [...prev, lang]));
    } else {
      // Toujours garder au moins une langue : sans ça, aucune formation ne
      // pourrait jamais obtenir un score de prérequis correct (voir le
      // prérequis implicite de langue dans lib/matching/engine.ts).
      setLanguages((prev) => (prev.length > 1 ? prev.filter((l) => l !== lang) : prev));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <ProfileReliabilityNotice validation={validation} />

      <Card>
        <h2 className="mb-5 text-base font-semibold text-slate-900">Votre parcours actuel</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="currentLevel">Niveau actuel</Label>
            <Select
              id="currentLevel"
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value as AcademicLevel)}
            >
              {ACADEMIC_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="fieldOfStudy">Domaine d&apos;études</Label>
            <Select
              id="fieldOfStudy"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value as Domain)}
            >
              {DOMAINS.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="currentDegree">Diplôme actuel / en cours</Label>
            <Input
              id="currentDegree"
              value={currentDegree}
              onChange={(e) => setCurrentDegree(e.target.value)}
              placeholder="ex : Licence en Informatique"
              list="degree-suggestions"
            />
            <datalist id="degree-suggestions">
              {CURRENT_DEGREE_SUGGESTIONS.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
            <p className="mt-1.5 text-xs text-slate-500">
              Si vous laissez ce champ vide, AcadMatch utilisera « {currentLevel} — {fieldOfStudy} ».
            </p>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="goal">Objectif de formation en France</Label>
            <Select id="goal" value={goal} onChange={(e) => setGoal(e.target.value as StudyGoal)}>
              {STUDY_GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>

          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 block text-sm font-medium text-slate-700">
              Langues dans lesquelles vous êtes à l&apos;aise pour suivre des cours
            </legend>
            <p className="mb-2.5 text-xs text-slate-500">
              Certaines formations sont enseignées entièrement en anglais — utilisé pour évaluer la
              compatibilité.
            </p>
            <div className="flex flex-wrap gap-4">
              {TEACHING_LANGUAGES.map((lang) => (
                <label key={lang} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={languages.includes(lang)}
                    onChange={(e) => toggleLanguage(lang, e.target.checked)}
                    className="size-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {lang}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-900">Matières et modules étudiés</h2>
        <p className="mb-5 text-sm text-slate-500">
          Ajoutez les matières marquantes de votre parcours (recommandé : au moins{" "}
          {RECOMMENDED_COURSES}). Elles seront comparées au contenu des formations.
        </p>
        <CourseSkillEditor
          label="Vos matières"
          items={courses}
          suggestions={SUGGESTED_COURSES[fieldOfStudy] ?? []}
          placeholder="ex : Bases de données"
          onChange={setCourses}
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-900">Compétences</h2>
        <p className="mb-5 text-sm text-slate-500">
          Vos compétences techniques ou transversales (recommandé : au moins {RECOMMENDED_SKILLS}).
        </p>
        <CourseSkillEditor
          label="Vos compétences"
          items={skills}
          suggestions={SUGGESTED_SKILLS[fieldOfStudy] ?? []}
          placeholder="ex : Python"
          onChange={setSkills}
        />
      </Card>

      {submitAttempted && validation.errors.length > 0 && (
        <div
          role="alert"
          className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-800"
        >
          <p className="font-semibold text-red-900">Complétez ces éléments avant de continuer :</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {validation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {hasExistingProfile ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Effacer mon profil
          </button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg">
          Enregistrer et rechercher
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}
