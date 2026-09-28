"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  NEUTRAL_ACADEMIC_STANDING,
  type AcademicLevel,
  type AcademicStanding,
  type StudentProfile,
  type StudyGoal,
} from "@/types";
import {
  ACADEMIC_LEVELS,
  ACADEMIC_STANDINGS,
  CURRENT_DEGREE_SUGGESTIONS,
  DOMAINS,
  LEGACY_DOMAINS,
  isCurrentDomain,
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
import { catalogueVocabulary, suggestedCourses, suggestedSkills } from "@/lib/profile/suggestions";
import { Card } from "@/components/ui/Card";
import { Label, Select, Input, Textarea } from "@/components/ui/Field";
import { MAX_EXPERIENCES_LENGTH } from "@/lib/ai/promptContext";
import { Button } from "@/components/ui/Button";
import { CourseSkillEditor } from "@/components/profile/CourseSkillEditor";
import { TranscriptImport } from "@/components/profile/TranscriptImport";
import { SyllabusImport } from "@/components/profile/SyllabusImport";
import { DocumentQuickStart } from "@/components/profile/DocumentQuickStart";
import { ProfileReliabilityNotice } from "@/components/profile/ProfileReliabilityNotice";
import { DegreeEquivalenceHelper } from "@/components/profile/DegreeEquivalenceHelper";
import { CatalogueScopeNotice } from "@/components/ui/CatalogueScopeNotice";
import { HEALTH_DOMAIN, HealthStudiesNotice } from "@/components/ui/HealthStudiesNotice";
import { FORMATIONS } from "@/data/formations";
import { isGoalCoveredByCatalogue } from "@/lib/search/filters";
import { EXAMPLE_PROFILE_LABEL, EXAMPLE_STUDENT_PROFILE } from "@/data/example-profile";
import { ArrowRight, FlaskConical } from "lucide-react";

const DEFAULT_DOMAIN: Domain = "Informatique";
const COURSE_VOCABULARY = catalogueVocabulary(FORMATIONS, "matiere");
const SKILL_VOCABULARY = catalogueVocabulary(FORMATIONS, "competence");

/** Ajoute les libellés importés absents de la liste (casse ignorée), dans l'ordre. */
function appendMissing(current: string[], names: string[]): string[] {
  const seen = new Set(current.map((c) => c.toLocaleLowerCase("fr")));
  const additions = names.filter((n) => {
    const key = n.toLocaleLowerCase("fr");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...current, ...additions];
}

export function ProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentLevel, setCurrentLevel] = useState<AcademicLevel>("Licence 3");
  // "" = domaine à choisir (profil enregistré avec un ancien domaine, voir LEGACY_DOMAINS).
  const [fieldOfStudy, setFieldOfStudy] = useState<Domain | "">(DEFAULT_DOMAIN);
  const [legacyField, setLegacyField] = useState<string | null>(null);
  const [currentDegree, setCurrentDegree] = useState("");
  const [courses, setCourses] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [goal, setGoal] = useState<StudyGoal>("Master");
  const [languages, setLanguages] = useState<string[]>(["Français"]);
  const [academicStanding, setAcademicStanding] = useState<AcademicStanding>(NEUTRAL_ACADEMIC_STANDING);
  const [experiences, setExperiences] = useState("");
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  // Nouveau visiteur (aucun profil enregistré) : les imports de documents
  // passent en tête du formulaire. Décidé une seule fois au montage — ils ne
  // doivent pas changer de place (et perdre leur état) pendant l'import.
  const [startWithDocuments, setStartWithDocuments] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Pré-remplit le formulaire si un profil existe déjà (édition, retour en arrière).
  useEffect(() => {
    const existing = loadProfile();
    if (!existing) {
      // localStorage n'existe pas côté serveur : décision possible seulement après le montage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStartWithDocuments(true);
      return;
    }
    // localStorage n'existe pas côté serveur : on ne peut hydrater le formulaire qu'après le montage.
    setCurrentLevel(existing.currentLevel);
    if (isCurrentDomain(existing.fieldOfStudy)) {
      setFieldOfStudy(existing.fieldOfStudy);
    } else if (existing.fieldOfStudy in LEGACY_DOMAINS) {
      // Ancien domaine scindé : l'étudiant choisit lui-même, on ne devine pas.
      setFieldOfStudy("");
      setLegacyField(existing.fieldOfStudy);
    } else {
      setFieldOfStudy(DEFAULT_DOMAIN);
    }
    setCurrentDegree(existing.currentDegree);
    setCourses(existing.courses.map((c) => c.name));
    setSkills(existing.skills);
    setGoal(existing.goal);
    setLanguages(existing.languages ?? ["Français"]);
    setAcademicStanding(existing.academicStanding ?? NEUTRAL_ACADEMIC_STANDING);
    setExperiences(existing.experiences ?? "");
    setHasExistingProfile(true);
  }, []);

  const courseSuggestions = useMemo(
    () => (fieldOfStudy ? suggestedCourses(FORMATIONS, fieldOfStudy, SUGGESTED_COURSES[fieldOfStudy]) : []),
    [fieldOfStudy],
  );
  const skillSuggestions = useMemo(
    () => (fieldOfStudy ? suggestedSkills(FORMATIONS, fieldOfStudy, SUGGESTED_SKILLS[fieldOfStudy]) : []),
    [fieldOfStudy],
  );

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
        academicStanding,
      }),
    [currentLevel, fieldOfStudy, currentDegree, courses, skills, goal, languages, academicStanding],
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
      academicStanding,
      ...(experiences.trim() ? { experiences: experiences.trim() } : {}),
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
    setLegacyField(null);
    setCurrentDegree("");
    setCourses([]);
    setSkills([]);
    setGoal("Master");
    setLanguages(["Français"]);
    setAcademicStanding(NEUTRAL_ACADEMIC_STANDING);
    setExperiences("");
    setHasExistingProfile(false);
    setSubmitAttempted(false);
  }

  function handleLoadExample() {
    const example = EXAMPLE_STUDENT_PROFILE;
    setCurrentLevel(example.currentLevel);
    setFieldOfStudy(example.fieldOfStudy as Domain);
    setLegacyField(null);
    setCurrentDegree(example.currentDegree);
    setCourses(example.courses.map((c) => c.name));
    setSkills(example.skills);
    setGoal(example.goal);
    setLanguages(example.languages);
    setAcademicStanding(example.academicStanding ?? NEUTRAL_ACADEMIC_STANDING);
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

  const transcriptImport = (
    <TranscriptImport
      existingCourses={courses}
      currentLevel={currentLevel}
      currentStanding={academicStanding}
      onAddCourses={(names) => setCourses((current) => appendMissing(current, names))}
      onApplyLevel={setCurrentLevel}
      onApplyStanding={setAcademicStanding}
    />
  );
  const syllabusImport = (
    <SyllabusImport
      existingCourses={courses}
      existingSkills={skills}
      onAddCourses={(names) => setCourses((current) => appendMissing(current, names))}
      onAddSkills={(names) => setSkills((current) => appendMissing(current, names))}
    />
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {startWithDocuments && <DocumentQuickStart transcriptImport={transcriptImport} syllabusImport={syllabusImport} />}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-sm text-slate-600">
          Pressé ? Chargez un parcours type pour voir immédiatement comment fonctionne AcadMatch.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={handleLoadExample}>
          <FlaskConical className="size-3.5" aria-hidden />
          {EXAMPLE_PROFILE_LABEL}
        </Button>
      </div>

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
            <DegreeEquivalenceHelper onApply={setCurrentLevel} />
          </div>

          <div>
            <Label htmlFor="fieldOfStudy">Domaine d&apos;études</Label>
            <Select
              id="fieldOfStudy"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value as Domain)}
            >
              {fieldOfStudy === "" && (
                <option value="" disabled>
                  Choisissez votre domaine…
                </option>
              )}
              {DOMAINS.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </Select>
            {fieldOfStudy === "" && legacyField && (
              <p className="mt-1.5 text-xs font-medium text-amber-700">
                Votre profil indiquait « {legacyField} », désormais séparé en{" "}
                {LEGACY_DOMAINS[legacyField].join(" et ")} pour un matching plus juste : choisissez le vôtre.
              </p>
            )}
          </div>

          {fieldOfStudy === HEALTH_DOMAIN && (
            <HealthStudiesNotice className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-slate-700" />
          )}

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
            <Label htmlFor="academicStanding">Vos résultats académiques</Label>
            <Select
              id="academicStanding"
              value={academicStanding}
              onChange={(e) => setAcademicStanding(e.target.value as AcademicStanding)}
            >
              {ACADEMIC_STANDINGS.map((standing) => (
                <option key={standing} value={standing}>
                  {standing}
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-xs text-slate-500">
              Auto-évaluation honnête, quel que soit votre système de notation d&apos;origine. Elle
              affine légèrement la compatibilité « Niveau / dossier » — elle ne vous exclut jamais
              d&apos;une formation.
            </p>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="goal">Objectif de formation</Label>
            <Select id="goal" value={goal} onChange={(e) => setGoal(e.target.value as StudyGoal)}>
              {STUDY_GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
            {!isGoalCoveredByCatalogue(FORMATIONS, goal) && (
              <CatalogueScopeNotice goal={goal} className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600" />
            )}
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
        {!startWithDocuments && <div className="mb-6">{transcriptImport}</div>}
        <CourseSkillEditor
          label="Vos matières"
          items={courses}
          suggestions={courseSuggestions}
          vocabulary={COURSE_VOCABULARY}
          placeholder="ex : Bases de données"
          onChange={setCourses}
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-900">Compétences</h2>
        <p className="mb-5 text-sm text-slate-500">
          Vos compétences techniques ou transversales (recommandé : au moins {RECOMMENDED_SKILLS}).
        </p>
        {!startWithDocuments && <div className="mb-6">{syllabusImport}</div>}
        <CourseSkillEditor
          label="Vos compétences"
          items={skills}
          suggestions={skillSuggestions}
          vocabulary={SKILL_VOCABULARY}
          placeholder="ex : Python"
          onChange={setSkills}
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-900">
          Expériences et projets <span className="font-normal text-slate-400">(optionnel)</span>
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Stages, projets, jobs, engagements associatifs… Non utilisés pour la compatibilité : ce sont les
          seules expériences que les assistants IA (lettre de motivation, entretiens) ont le droit de
          mentionner — ils n&apos;en inventent jamais.
        </p>
        <Textarea
          id="experiences"
          aria-label="Expériences et projets"
          value={experiences}
          onChange={(e) => setExperiences(e.target.value)}
          maxLength={MAX_EXPERIENCES_LENGTH}
          placeholder="ex : Stage de 2 mois en développement web chez… ; projet de fin d'année : application de…"
          className="min-h-24"
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
