"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, Columns2, FileText, FolderKanban, User, X } from "lucide-react";
import type { StudentProfile } from "@/types";
import { FORMATIONS } from "@/data/formations";
import {
  clearCompareIds,
  compareResultsHref,
  loadCompareIds,
  loadProfile,
  loadSavedFormationIds,
  MAX_COMPARE_FORMATIONS,
  toggleCompareId,
  toggleSavedFormationId,
} from "@/lib/storage";
import { computeCompatibility } from "@/lib/matching/engine";
import { validateStoredProfile } from "@/lib/profile/validation";
import { Card } from "@/components/ui/Card";
import { LinkButton, Button } from "@/components/ui/Button";
import { FormationCard } from "@/components/search/FormationCard";
import { ProfileReliabilityNotice } from "@/components/profile/ProfileReliabilityNotice";

/**
 * Espace projet étudiant (Phase 12) — regroupe profil, formations
 * sauvegardées et comparaisons en cours. Réutilise entièrement les données
 * et composants existants (aucun second stockage de profil, aucun second
 * moteur de score, même FormationCard que /recherche) : la seule donnée
 * réellement nouvelle est la liste des sauvegardes (lib/storage.ts).
 * Documents et Projet d'études restent des cartes "à venir" — ces
 * fonctionnalités n'existent pas encore (Phases 15/17), et le principe du
 * projet est de ne jamais présenter une absence de donnée comme un résultat.
 */
export function EspaceView() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
    setSavedIds(loadSavedFormationIds());
    setCompareIds(loadCompareIds());
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

      {/* Documents — pas encore construit (Phase 15) */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <FileText className="size-4 text-slate-500" />
          Documents
        </h2>
        <Card className="border-dashed text-center">
          <p className="text-sm text-slate-400">
            Bientôt disponible : suivi des documents par candidature (checklist, statut, source).
          </p>
        </Card>
      </section>

      {/* Projet d'études — pas encore construit (Phase 17) */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <FolderKanban className="size-4 text-slate-500" />
          Projet d&apos;études
        </h2>
        <Card className="border-dashed text-center">
          <p className="text-sm text-slate-400">
            Bientôt disponible : vue synthétique formations ciblées, calendrier, candidatures et budget.
          </p>
        </Card>
      </section>
    </div>
  );
}
