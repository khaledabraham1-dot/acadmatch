"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, CalendarDays, ClipboardList, Columns2, FolderKanban, User, X } from "lucide-react";
import type { Application, StudentProfile } from "@/types";
import { FORMATIONS, getFormationById } from "@/data/formations";
import {
  clearCompareIds,
  compareResultsHref,
  loadApplications,
  loadCompareIds,
  loadProfile,
  loadSavedFormationIds,
  MAX_COMPARE_FORMATIONS,
  toggleCompareId,
  toggleSavedFormationId,
} from "@/lib/storage";
import { applicationStatusTone, sortApplicationsByUrgency } from "@/lib/applications";
import { buildCalendarEntries, formatCalendarDate, sortCalendarEntries } from "@/lib/calendar";
import { buildTargetedFormations, summarizeStudyProject } from "@/lib/studyProject";
import { computeCompatibility } from "@/lib/matching/engine";
import { validateStoredProfile } from "@/lib/profile/validation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton, Button } from "@/components/ui/Button";
import { FormationCard } from "@/components/search/FormationCard";
import { ProfileReliabilityNotice } from "@/components/profile/ProfileReliabilityNotice";

/**
 * Espace projet étudiant (Phase 12) — regroupe profil, formations
 * sauvegardées, comparaisons en cours, un résumé du suivi des candidatures
 * (Phase 13), des prochains rappels du calendrier (Phase 14) et une
 * synthèse du projet d'études (Phase 16 : formations ciblées, pays,
 * objectifs, avancement documentaire). Réutilise entièrement les données
 * et composants existants (aucun second stockage de profil, aucun second
 * moteur de score, mêmes fonctions lib/calendar.ts, lib/applications.ts et
 * lib/studyProject.ts qu'ailleurs) — la synthèse du projet d'études
 * n'affiche QUE des agrégats qu'aucune autre section ne montre déjà
 * (candidatures/calendrier gardent leur propre section, jamais dupliqués
 * ici). Documents n'a jamais eu besoin de sa propre section : le suivi
 * documentaire (Phase 15) vit dans chaque candidature sur /candidatures,
 * et son agrégat rejoint la synthèse du projet d'études ci-dessous.
 */
export function EspaceView() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
    setSavedIds(loadSavedFormationIds());
    setCompareIds(loadCompareIds());
    setApplications(loadApplications());
    setReady(true);
  }, []);

  const scores = useMemo(() => {
    if (!profile) return new Map<string, number>();
    return new Map(
      FORMATIONS.map((formation) => [formation.id, computeCompatibility(profile, formation).overallScore]),
    );
  }, [profile]);

  const savedFormations = savedIds
    .map((id) => FORMATIONS.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  const compareNames = compareIds
    .map((id) => FORMATIONS.find((f) => f.id === id)?.name)
    .filter(Boolean);

  const topApplications = useMemo(
    () => sortApplicationsByUrgency(applications).slice(0, 3),
    [applications],
  );

  const upcomingCalendarEntries = useMemo(
    () => sortCalendarEntries(buildCalendarEntries(applications, FORMATIONS)).slice(0, 3),
    [applications],
  );

  const studyProjectSummary = useMemo(
    () => summarizeStudyProject(buildTargetedFormations(savedIds, applications, FORMATIONS)),
    [savedIds, applications],
  );

  function handleToggleSave(formationId: string) {
    setSavedIds(toggleSavedFormationId(formationId));
  }

  function handleToggleCompare(formationId: string) {
    setCompareIds(toggleCompareId(formationId));
  }

  function handleClearCompare() {
    clearCompareIds();
    setCompareIds([]);
  }

  if (!ready) return null;

  return (
    <div className="space-y-8">
      {/* Profil */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <User className="size-4 text-slate-500" />
          Profil
        </h2>
        {profile ? (
          <div className="space-y-3">
            <Card className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{profile.currentDegree}</p>
                <p className="text-sm text-slate-500">
                  {profile.currentLevel} · {profile.fieldOfStudy} · Objectif {profile.goal}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Langues : {profile.languages.join(", ")}
                </p>
              </div>
              <Link href="/profil" className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700">
                Modifier
              </Link>
            </Card>
            <ProfileReliabilityNotice validation={validateStoredProfile(profile)} editHref="/profil?next=/espace" />
          </div>
        ) : (
          <Card className="flex flex-wrap items-center justify-between gap-3 border-blue-100 bg-blue-50/60">
            <p className="text-sm text-blue-800">
              Aucun profil renseigné pour l&apos;instant — indispensable pour calculer votre compatibilité.
            </p>
            <LinkButton href="/profil?next=/espace" size="sm">
              Analyser mon profil
              <ArrowRight className="size-3.5" />
            </LinkButton>
          </Card>
        )}
      </section>

      {/* Formations sauvegardées */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <Bookmark className="size-4 text-slate-500" />
          Formations sauvegardées
          {savedFormations.length > 0 && (
            <span className="text-sm font-normal text-slate-400">({savedFormations.length})</span>
          )}
        </h2>
        {savedFormations.length > 0 ? (
          <div className="space-y-4">
            {savedFormations.map((formation) => (
              <FormationCard
                key={formation.id}
                formation={formation}
                score={scores.get(formation.id) ?? null}
                saved
                onToggleSave={handleToggleSave}
                selectedForCompare={compareIds.includes(formation.id)}
                compareCount={compareIds.length}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed text-center">
            <p className="text-sm text-slate-400">
              Aucune formation sauvegardée pour l&apos;instant. Sur{" "}
              <Link href="/recherche" className="font-medium text-blue-600 hover:text-blue-700">
                la recherche
              </Link>
              , cliquez sur l&apos;icône marque-page d&apos;une fiche pour la retrouver ici.
            </p>
          </Card>
        )}
      </section>

      {/* Comparaisons en cours */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <Columns2 className="size-4 text-slate-500" />
          Comparaison en cours
        </h2>
        {compareIds.length > 0 ? (
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {compareIds.length}/{MAX_COMPARE_FORMATIONS} formation{compareIds.length > 1 ? "s" : ""} sélectionnée
                {compareIds.length > 1 ? "s" : ""}
              </p>
              <p className="truncate text-sm text-slate-500">{compareNames.join(" · ")}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleClearCompare}>
                <X className="size-3.5" />
                Vider
              </Button>
              {compareIds.length >= 2 ? (
                <LinkButton href={compareResultsHref(compareIds)} size="sm">
                  Comparer maintenant
                  <ArrowRight className="size-3.5" />
                </LinkButton>
              ) : (
                <LinkButton href="/recherche" size="sm" variant="outline">
                  Ajouter une formation
                </LinkButton>
              )}
            </div>
          </Card>
        ) : (
          <Card className="border-dashed text-center">
            <p className="text-sm text-slate-400">
              Aucune comparaison en cours. Sur{" "}
              <Link href="/recherche" className="font-medium text-blue-600 hover:text-blue-700">
                la recherche
              </Link>
              , cochez « Comparer » sur 2 ou 3 fiches.
            </p>
          </Card>
        )}
      </section>

      {/* Suivi des candidatures (Phase 13) */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <ClipboardList className="size-4 text-slate-500" />
          Candidatures
          {applications.length > 0 && (
            <span className="text-sm font-normal text-slate-400">({applications.length})</span>
          )}
        </h2>
        {applications.length > 0 ? (
          <Card className="space-y-3">
            <ul className="space-y-2">
              {topApplications.map((application) => {
                const formation = getFormationById(application.formationId);
                if (!formation) return null;
                return (
                  <li key={application.formationId} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-slate-700">{formation.name}</span>
                    <Badge tone={applicationStatusTone(application.status)}>{application.status}</Badge>
                  </li>
                );
              })}
            </ul>
            <LinkButton href="/candidatures" size="sm" variant="outline">
              Voir toutes mes candidatures
              <ArrowRight className="size-3.5" />
            </LinkButton>
          </Card>
        ) : (
          <Card className="border-dashed text-center">
            <p className="text-sm text-slate-400">
              Aucune candidature suivie pour l&apos;instant.{" "}
              <Link href="/candidatures" className="font-medium text-blue-600 hover:text-blue-700">
                Démarrer le suivi
              </Link>
              .
            </p>
          </Card>
        )}
      </section>

      {/* Calendrier personnalisé (Phase 14) */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <CalendarDays className="size-4 text-slate-500" />
          Calendrier
        </h2>
        {upcomingCalendarEntries.length > 0 ? (
          <Card className="space-y-3">
            <ul className="space-y-2">
              {upcomingCalendarEntries.map((entry) => (
                <li
                  key={`${entry.formationId}-${entry.source}-${entry.itemId ?? "deadline"}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate text-slate-700">{entry.label}</span>
                  <span className="shrink-0 text-xs text-slate-400">{formatCalendarDate(entry.date)}</span>
                </li>
              ))}
            </ul>
            <LinkButton href="/calendrier" size="sm" variant="outline">
              Voir le calendrier complet
              <ArrowRight className="size-3.5" />
            </LinkButton>
          </Card>
        ) : (
          <Card className="border-dashed text-center">
            <p className="text-sm text-slate-400">
              Aucun rappel pour l&apos;instant. Ajoutez une échéance personnelle depuis{" "}
              <Link href="/candidatures" className="font-medium text-blue-600 hover:text-blue-700">
                le suivi des candidatures
              </Link>
              .
            </p>
          </Card>
        )}
      </section>

      {/* Projet d'études — synthèse (Phase 16) */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <FolderKanban className="size-4 text-slate-500" />
          Projet d&apos;études
        </h2>
        {studyProjectSummary.totalFormations > 0 ? (
          <Card className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-2xl font-semibold text-slate-900">{studyProjectSummary.totalFormations}</p>
                <p className="text-xs text-slate-500">
                  Formation{studyProjectSummary.totalFormations > 1 ? "s" : ""} ciblée
                  {studyProjectSummary.totalFormations > 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {Object.keys(studyProjectSummary.countryCounts).length}
                </p>
                <p className="text-xs text-slate-500">Pays</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {Object.keys(studyProjectSummary.goalCounts).length}
                </p>
                <p className="text-xs text-slate-500">Objectif{Object.keys(studyProjectSummary.goalCounts).length > 1 ? "s" : ""}</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {studyProjectSummary.documentsDone}/{studyProjectSummary.documentsTotal}
                </p>
                <p className="text-xs text-slate-500">Documents réunis</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {Object.entries(studyProjectSummary.countryCounts).map(([country, count]) => (
                <span key={country} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {country} ({count})
                </span>
              ))}
              {Object.entries(studyProjectSummary.goalCounts).map(([goal, count]) => (
                <span key={goal} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                  {goal} ({count})
                </span>
              ))}
            </div>

            {studyProjectSummary.requiredDocumentsPending > 0 && (
              <p className="text-sm text-amber-700">
                {studyProjectSummary.requiredDocumentsPending} document
                {studyProjectSummary.requiredDocumentsPending > 1 ? "s" : ""} obligatoire
                {studyProjectSummary.requiredDocumentsPending > 1 ? "s" : ""} encore à réunir — voir{" "}
                <Link href="/candidatures" className="font-medium underline underline-offset-2">
                  le suivi des candidatures
                </Link>
                .
              </p>
            )}
          </Card>
        ) : (
          <Card className="border-dashed text-center">
            <p className="text-sm text-slate-400">
              Aucune formation ciblée pour l&apos;instant. Sauvegardez une formation ou suivez une candidature pour
              voir apparaître votre projet d&apos;études ici.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
