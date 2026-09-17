"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ClipboardCheck, BookOpen, Wrench, GraduationCap, ArrowRight } from "lucide-react";
import type { StudentProfile } from "@/types";
import { getFormationById } from "@/data/formations";
import { loadProfile, saveSelectedFormationId } from "@/lib/storage";
import { computeCompatibility } from "@/lib/matching/engine";
import { validateStoredProfile } from "@/lib/profile/validation";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { ProfileReliabilityNotice } from "@/components/profile/ProfileReliabilityNotice";
import { ScoreCircle } from "@/components/result/ScoreCircle";
import { CriteriaBar } from "@/components/result/CriteriaBar";
import { StrengthsGaps } from "@/components/result/StrengthsGaps";
import { MatchTable } from "@/components/result/MatchTable";
import { ComparisonSummary } from "@/components/result/ComparisonSummary";

export function ResultView() {
  const searchParams = useSearchParams();
  const formationId = searchParams.get("formationId");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // localStorage n'existe pas côté serveur : la lecture doit se faire après le montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
    setReady(true);
    if (formationId) saveSelectedFormationId(formationId);
  }, [formationId]);

  if (!ready) return null;

  if (!formationId) {
    return (
      <EmptyState
        title="Choisissez une formation à comparer"
        description="Recherchez une formation française pour lancer l'analyse de compatibilité."
        ctaHref="/recherche"
        ctaLabel="Rechercher une formation"
      />
    );
  }

  const formation = getFormationById(formationId);
  if (!formation) {
    return (
      <EmptyState
        title="Formation introuvable"
        description="Cette formation n'existe pas ou plus."
        ctaHref="/recherche"
        ctaLabel="Retour à la recherche"
      />
    );
  }

  if (!profile) {
    return (
      <EmptyState
        title="Renseignez votre profil académique"
        description="Nous avons besoin de votre parcours pour calculer votre compatibilité avec cette formation."
        ctaHref={`/profil?next=${encodeURIComponent(`/resultat?formationId=${formation.id}`)}`}
        ctaLabel="Analyser mon profil"
      />
    );
  }

  const result = computeCompatibility(profile, formation);
  const profileValidation = validateStoredProfile(profile);
  const editProfileHref = `/profil?next=${encodeURIComponent(`/resultat?formationId=${formation.id}`)}`;

  return (
    <div className="space-y-6">
      {formation.demo && <DemoDataBadge />}
      <ProfileReliabilityNotice
        validation={profileValidation}
        editHref={editProfileHref}
      />
      <ComparisonSummary profile={profile} formation={formation} />

      <Card>
        <h2 className="mb-6 text-base font-semibold text-slate-900">Résultats de compatibilité</h2>
        {/*
          minmax(0,1fr), pas juste 1fr : sans le minmax, la colonne des
          barres de critère ne pouvait pas rétrécir sous la largeur
          intrinsèque de son contenu et débordait horizontalement autour de
          768-900px (constaté en testant la responsivité).
        */}
        <div className="grid gap-8 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex justify-center sm:border-r sm:border-slate-100 sm:pr-8">
            <ScoreCircle score={result.overallScore} />
          </div>
          <div className="flex flex-col justify-center gap-4">
            <CriteriaBar label="Prérequis" score={result.breakdown.prerequisites} icon={<ClipboardCheck className="size-4" />} />
            <CriteriaBar label="Contenu académique" score={result.breakdown.academicContent} icon={<BookOpen className="size-4" />} />
            <CriteriaBar label="Compétences" score={result.breakdown.skills} icon={<Wrench className="size-4" />} />
            <CriteriaBar label="Niveau / diplôme" score={result.breakdown.levelDegree} icon={<GraduationCap className="size-4" />} />
          </div>
        </div>
      </Card>

      <StrengthsGaps strengths={result.strengths} gaps={result.gaps} />

      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-900">Correspondance des matières</h2>
        <p className="mb-5 text-sm text-slate-500">
          Comparaison entre vos matières/compétences et les exigences de la formation.
        </p>
        <MatchTable matches={result.matches} />
      </Card>

      <p className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
        Ce score ne garantit pas l&apos;admission : il mesure une adéquation académique entre votre
        parcours et le contenu affiché de cette formation{formation.demo ? " de démonstration" : ""}.
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-4 py-12 text-center">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1.5 text-sm text-slate-500">{description}</p>
      </div>
      <LinkButton href={ctaHref}>
        {ctaLabel}
        <ArrowRight className="size-4" />
      </LinkButton>
    </Card>
  );
}
