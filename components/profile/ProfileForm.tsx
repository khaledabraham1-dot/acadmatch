"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  NEUTRAL_ACADEMIC_STANDING,
  type AcademicLevel,
  type AcademicStanding,
  type StudentProfile,
  type StudyGoal,
  type TranscriptAverage,
} from "@/types";
import { describeAverage, mentionFor, standingFromAverage, validTranscriptAverage } from "@/lib/profile/grades";
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
import { ProfileStepper } from "@/components/profile/ProfileStepper";
import { ProvisionalPreview } from "@/components/profile/ProvisionalPreview";
import { canOpenStep, firstBlockingStep, isPathStepComplete, type ProfileStep } from "@/lib/profile/steps";
import { ArrowLeft, ArrowRight, FlaskConical } from "lucide-react";

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
  // "" = domaine à choisir. Aucun domaine présélectionné (audit du 2026-09-30) :
  // l'ancien défaut « Informatique » orientait les suggestions de tout nouveau
  // visiteur vers l'informatique, quel que soit son parcours.
  const [fieldOfStudy, setFieldOfStudy] = useState<Domain | "">("");
  // Domaine d'où viennent les matières déjà saisies, quand l'étudiant en change.
  const [previousDomain, setPreviousDomain] = useState<Domain | null>(null);
  const [legacyField, setLegacyField] = useState<string | null>(null);
  const [currentDegree, setCurrentDegree] = useState("");
  const [courses, setCourses] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [goal, setGoal] = useState<StudyGoal>("Master");
  const [languages, setLanguages] = useState<string[]>(["Français"]);
  const [academicStanding, setAcademicStanding] = useState<AcademicStanding>(NEUTRAL_ACADEMIC_STANDING);
  const [experiences, setExperiences] = useState("");
  // Moyenne lue sur le relevé importé : remplace l'auto-évaluation dans le score.
  const [transcriptAverage, setTranscriptAverage] = useState<TranscriptAverage | null>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  // Nouveau visiteur (aucun profil enregistré) : les imports de documents
  // passent en tête du formulaire. Décidé une seule fois au montage — ils ne
  // doivent pas changer de place (et perdre leur état) pendant l'import.
  const [startWithDocuments, setStartWithDocuments] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [step, setStep] = useState<ProfileStep>(1);
  const [pathStepMissing, setPathStepMissing] = useState(false);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  // Pas de focus au premier affichage : seulement après un changement d'étape.
  const stepChanged = useRef(false);

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
      setFieldOfStudy("");
    }
    setCurrentDegree(existing.currentDegree);
    setCourses(existing.courses.map((c) => c.name));
    setSkills(existing.skills);
    setGoal(existing.goal);
    setLanguages(existing.languages ?? ["Français"]);
    setAcademicStanding(existing.academicStanding ?? NEUTRAL_ACADEMIC_STANDING);
    setExperiences(existing.experiences ?? "");
    setTranscriptAverage(validTranscriptAverage(existing));
    setHasExistingProfile(true);
    // « Compléter mon profil » (page résultat) : ouvrir directement l'étape demandée,
    // si le parcours enregistré permet d'y accéder (domaine toujours valide).
    const requested = Number(searchParams.get("etape"));
    if ((requested === 2 || requested === 3) && isCurrentDomain(existing.fieldOfStudy)) setStep(requested);
    // Lecture unique au montage : l'étape suit ensuite la navigation de l'étudiant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const stepDraft = { fieldOfStudy, languages, courses, skills };

  function buildProfile(courseId: (index: number) => string): StudentProfile {
    return {
      currentLevel,
      fieldOfStudy,
      currentDegree: currentDegree.trim() || `${currentLevel} — ${fieldOfStudy}`,
      courses: courses.map((name, index) => ({ id: courseId(index), name })),
      skills,
      goal,
      languages,
      academicStanding,
      ...(experiences.trim() ? { experiences: experiences.trim() } : {}),
      ...(transcriptAverage ? { transcriptAverage } : {}),
    };
  }

  // Brouillon pour l'aperçu provisoire (identifiants stables : pas de recalcul à chaque rendu).
  const draftProfile = useMemo(
    () => (validation.isSubmittable ? buildProfile((index) => `draft-${index}`) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildProfile ne lit que ces valeurs
    [validation.isSubmittable, currentLevel, fieldOfStudy, currentDegree, courses, skills, goal, languages, academicStanding, transcriptAverage],
  );

  useEffect(() => {
    if (!stepChanged.current) return;
    stepHeadingRef.current?.focus();
    stepHeadingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step]);

  function goToStep(next: ProfileStep) {
    if (!canOpenStep(next, stepDraft)) return;
    stepChanged.current = true;
    setStep(next);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!validation.isSubmittable) {
      // Ramène l'étudiant là où il peut corriger, sans perdre ce qu'il a saisi.
      const blocking = firstBlockingStep(stepDraft);
      if (blocking && blocking !== step) {
        stepChanged.current = true;
        setStep(blocking);
      }
      return;
    }

    const profile = buildProfile(() => generateId("course"));

    saveProfile(profile);
    setHasExistingProfile(true);

    const next = safeInternalPath(searchParams.get("next"));
    router.push(next);
  }

  // Le formulaire contient-il encore le profil exemple (chargé plus tôt) ?
  // Sans ce signal, un visiteur qui avait cliqué « Essayer un exemple »
  // retrouvait des matières d'informatique en décrivant son propre parcours.
  const isExampleProfile =
    fieldOfStudy === EXAMPLE_STUDENT_PROFILE.fieldOfStudy &&
    courses.join("|") === EXAMPLE_STUDENT_PROFILE.courses.map((c) => c.name).join("|") &&
    skills.join("|") === EXAMPLE_STUDENT_PROFILE.skills.join("|");

  function handleDomainChange(next: Domain) {
    // Changer de domaine avec des matières déjà saisies : proposer de repartir
    // de zéro plutôt que de garder, sans le dire, celles d'un autre parcours.
    if (fieldOfStudy && fieldOfStudy !== next && (courses.length > 0 || skills.length > 0)) {
      setPreviousDomain((prev) => prev ?? fieldOfStudy);
    }
    setFieldOfStudy(next);
  }

  function handleClear() {
    clearProfile();
    setCurrentLevel("Licence 3");
    setFieldOfStudy("");
    setPreviousDomain(null);
    setLegacyField(null);
    setCurrentDegree("");
    setCourses([]);
    setSkills([]);
    setGoal("Master");
    setLanguages(["Français"]);
    setAcademicStanding(NEUTRAL_ACADEMIC_STANDING);
    setExperiences("");
    setTranscriptAverage(null);
    setHasExistingProfile(false);
    setSubmitAttempted(false);
    setStep(1);
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
    setTranscriptAverage(null);
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
      onAddCourses={(names) => setCourses((current) => appendMissing(current, names))}
      onApplyLevel={setCurrentLevel}
      onApplyAverage={setTranscriptAverage}
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
      {isExampleProfile && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm text-amber-900">
            Ce formulaire contient le <strong>profil exemple</strong> ({EXAMPLE_PROFILE_LABEL}), pas le vôtre.
          </p>
          <Button type="button" size="sm" variant="secondary" onClick={handleClear}>
            Repartir d&apos;un profil vide
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-sm text-slate-600">
          Pressé ? Chargez un parcours type pour voir immédiatement comment fonctionne AcadMatch.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={handleLoadExample}>
          <FlaskConical className="size-3.5" aria-hidden />
          {EXAMPLE_PROFILE_LABEL}
        </Button>
      </div>

      <ProfileStepper
        current={step}
        canOpen={(target) => canOpenStep(target, stepDraft)}
        isDone={(target) => (target === 1 ? isPathStepComplete(stepDraft) : target === 2 ? firstBlockingStep(stepDraft) === null : false)}
        onSelect={goToStep}
      />

      <div hidden={step !== 1} className="space-y-6">
      <Card>
        <h2 ref={step === 1 ? stepHeadingRef : undefined} tabIndex={-1} className="mb-5 text-base font-semibold text-slate-900 focus:outline-none">
          Étape 1 — Votre parcours actuel
        </h2>
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
              onChange={(e) => handleDomainChange(e.target.value as Domain)}
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
            {previousDomain && previousDomain !== fieldOfStudy && (courses.length > 0 || skills.length > 0) && (
              <div role="status" className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
                Vos matières et compétences actuelles viennent peut-être de votre profil en {previousDomain}.
                <span className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCourses([]);
                      setSkills([]);
                      setPreviousDomain(null);
                    }}
                    className="rounded-lg bg-amber-900 px-3 py-1.5 font-bold text-white"
                  >
                    Vider matières et compétences
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviousDomain(null)}
                    className="rounded-lg px-3 py-1.5 font-bold text-amber-900 underline underline-offset-2"
                  >
                    Les garder
                  </button>
                </span>
              </div>
            )}
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

      </div>

      <div hidden={step !== 2} className="space-y-6">
      <h2 ref={step === 2 ? stepHeadingRef : undefined} tabIndex={-1} className="text-base font-semibold text-slate-900 focus:outline-none">
        Étape 2 — Ce que vous avez étudié
      </h2>
      {startWithDocuments && <DocumentQuickStart transcriptImport={transcriptImport} syllabusImport={syllabusImport} />}

      <Card>
        <h3 className="mb-1 text-base font-semibold text-slate-900">Matières et modules étudiés</h3>
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

      {/* Juste sous les matières : l'aperçu réagit sous les yeux de l'étudiant, même sur mobile. */}
      <ProfileReliabilityNotice validation={validation} />
      <ProvisionalPreview profile={step === 2 ? draftProfile : null} />

      <Card>
        <h3 className="mb-1 text-base font-semibold text-slate-900">Compétences</h3>
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

      </div>

      <div hidden={step !== 3} className="space-y-6">
      <Card>
        <h2 ref={step === 3 ? stepHeadingRef : undefined} tabIndex={-1} className="mb-1 text-base font-semibold text-slate-900 focus:outline-none">
          Étape 3 — Affiner <span className="font-normal text-slate-500">(optionnel)</span>
        </h2>
        <p className="mb-5 text-sm text-slate-500">
          Vos résultats comptent dans le score, surtout face aux formations sélectives. Le reste sert aux
          assistants de candidature.
        </p>
        <div className="grid gap-5">
          <div>
            <Label htmlFor="academicStanding">Vos résultats académiques</Label>
            {transcriptAverage ? (
              <div className="rounded-[14px] border border-blue-200 bg-blue-50 px-3.5 py-3 text-sm text-slate-800">
                <p>
                  <strong className="font-bold">D&apos;après votre relevé : {describeAverage(transcriptAverage)}</strong>, mention «&nbsp;
                  {mentionFor(transcriptAverage.valueOn20)}&nbsp;» → {standingFromAverage(transcriptAverage.valueOn20)}.
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Ce sont vos vraies notes qui comptent dans le score, pas une auto-évaluation.{" "}
                  <button
                    type="button"
                    onClick={() => setTranscriptAverage(null)}
                    className="font-bold text-slate-700 underline underline-offset-2"
                  >
                    Ne plus utiliser la moyenne du relevé
                  </button>
                </p>
              </div>
            ) : (
              <>
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
              Auto-évaluation honnête, quel que soit votre système de notation d&apos;origine. Elle compte
              dans le score, surtout face aux formations très sélectives. Importez votre relevé : votre vraie
              moyenne la remplacera.
            </p>
              </>
            )}
          </div>

          <div>
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

        </div>
      </Card>

      <Card>
        <h3 className="mb-1 text-base font-semibold text-slate-900">
          Expériences et projets <span className="font-normal text-slate-500">(optionnel)</span>
        </h3>
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

      <ProvisionalPreview profile={step === 3 ? draftProfile : null} />
      </div>

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

      {pathStepMissing && step === 1 && !isPathStepComplete(stepDraft) && (
        <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-900">
          Choisissez votre domaine d&apos;études pour continuer.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          {step > 1 && (
            <Button type="button" variant="ghost" onClick={() => goToStep((step - 1) as ProfileStep)}>
              <ArrowLeft className="size-4" aria-hidden />
              Retour
            </Button>
          )}
          {hasExistingProfile && (
            <button
              type="button"
              onClick={handleClear}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Effacer mon profil
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {step < 3 && (
            <Button
              type="button"
              size="lg"
              variant={step === 1 && !validation.isSubmittable ? "primary" : "outline"}
              onClick={() => {
                if (step === 1 && !isPathStepComplete(stepDraft)) {
                  setPathStepMissing(true);
                  return;
                }
                goToStep((step + 1) as ProfileStep);
              }}
            >
              {step === 1 ? "Continuer" : "Affiner (optionnel)"}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
          {(step > 1 || validation.isSubmittable) && (
            <Button type="submit" size="lg">
              Voir mes résultats
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
