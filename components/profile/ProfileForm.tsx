"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AcademicLevel, StudentProfile, StudyGoal } from "@/types";
import {
  ACADEMIC_LEVELS,
  CURRENT_DEGREE_SUGGESTIONS,
  DOMAINS,
  STUDY_GOALS,
  SUGGESTED_COURSES,
  SUGGESTED_SKILLS,
  type Domain,
} from "@/data/subjects";
import { loadProfile, saveProfile } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Label, Select, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { CourseSkillEditor } from "@/components/profile/CourseSkillEditor";
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
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const profile: StudentProfile = {
      currentLevel,
      fieldOfStudy,
      currentDegree: currentDegree.trim() || `${currentLevel} — ${fieldOfStudy}`,
      courses: courses.map((name) => ({ id: generateId("course"), name })),
      skills,
      goal,
    };

    saveProfile(profile);

    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/recherche");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-900">Matières et modules étudiés</h2>
        <p className="mb-5 text-sm text-slate-500">
          Ajoutez les matières marquantes de votre parcours — elles seront comparées au contenu des formations.
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
          Vos compétences techniques ou transversales (langages, outils, langues...).
        </p>
        <CourseSkillEditor
          label="Vos compétences"
          items={skills}
          suggestions={SUGGESTED_SKILLS[fieldOfStudy] ?? []}
          placeholder="ex : Python"
          onChange={setSkills}
        />
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Rechercher une formation
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}
