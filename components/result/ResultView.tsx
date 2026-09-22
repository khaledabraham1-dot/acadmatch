"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ClipboardCheck, BookOpen, Wrench, GraduationCap, ArrowRight } from "lucide-react";
import type { StudentProfile } from "@/types";
import { getFormationById } from "@/data/formations";
import { loadProfile, saveSelectedFormationId } from "@/lib/storage";
import { computeCompatibility } from "@/lib/matching/engine";
import { buildDecisionAid } from "@/lib/matching/explanation";
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
import { CompatibilityExplanation } from "@/components/result/CompatibilityExplanation";
import { ActionPlan } from "@/components/result/ActionPlan";
import { EligibilitySection } from "@/components/result/EligibilitySection";
import { OfficialSourceCard } from "@/components/result/OfficialSourceCard";
import { FormationCompareTable } from "@/components/result/FormationCompareTable";
import { ResultFeedback } from "@/components/result/ResultFeedback";

/** Parse `?compare=id1,id2,id3` en liste d'ids valides (2–3). */
function parseCompareIds(raw: string | null): string[] {
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ].slice(0, 3);
}

export function ResultView() {
  const searchParams = useSearchParams();
  const formationId = searchParams.get("formationId");
  const compareIds = parseCompareIds(searchParams.get("compare"));
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

  if (!profile) {
    const next =
      compareIds.length >= 2
        ? `/resultat?compare=${compareIds.map(encodeURIComponent).join(",")}`
        : formationId
          ? `/resultat?formationId=${encodeURIComponent(formationId)}`
          : "/resultat";
    return (
      <EmptyState
        title="Renseignez votre profil académique"
        description="Nous avons besoin de votre parcours pour calculer votre compatibilité."
        ctaHref={`/profil?next=${encodeURIComponent(next)}`}
        ctaLabel="Analyser mon profil"
      />
    );
  }

  // Mode comparaison multi-formations (Étape 7).
  if (compareIds.length >= 2) {
    const formations = compareIds
      .map((id) => getFormationById(id))
      .filter((f): f is NonNullable<typeof f> => Boolean(f));

    if (formations.length < 2) {
      return (
        <EmptyState
          title="Comparaison impossible"
          description="Au moins deux formations valides sont nécessaires. Revenez à la recherche pour en sélectionner."
          ctaHref="/recherche"
          ctaLabel="Retour à la recherche"
        />
      );
    }

    const profileValidation = validateStoredProfile(profile);

    return (
      <div className="space-y-6">
        {formations.some((f) => f.demo) && <DemoDataBadge />}
        <ProfileReliabilityNotice
          validation={profileValidation}
          editHref={`/profil?next=${encodeURIComponent(`/resultat?compare=${compareIds.join(",")}`)}`}
        />
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Comparaison de {formations.length} formations
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Vue côte-à-côte pour décider laquelle approfondir — puis ouvrez l&apos;analyse détaillée.
          </p>
        </div>
        <FormationCompareTable profile={profile} formations={formations} />
        <div className="flex justify-end">
          <LinkButton href="/recherche" variant="outline" size="sm">
            Modifier la sélection
          </LinkButton>
        </div>
      </div>
    );
  }

  if (!formationId) {
    return (
      <EmptyState
        title="Choisissez une formation à analyser"
        description="Recherchez une formation, ou sélectionnez-en 2 à 3 pour les comparer côte à côte."
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

  const result = computeCompatibility(profile, formation);
  const aid = buildDecisionAid(profile, formation, result);
  const profileValidation = validateStoredProfile(profile);
  const editProfileHref = `/profil?next=${encodeURIComponent(`/resultat?formationId=${formation.id}`)}`;

  return (
    <div className="space-y-6">
      {formation.demo && <DemoDataBadge />}
      <ProfileReliabilityNotice validation={profileValidation} editHref={editProfileHref} />
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
            <CriteriaBar
              label="Prérequis"
              score={result.breakdown.prerequisites}
              icon={<ClipboardCheck className="size-4" />}
            />
            <CriteriaBar
              label="Contenu académique"
              score={result.breakdown.academicContent}
              icon={<BookOpen className="size-4" />}
            />
            <CriteriaBar
              label="Compétences"
              score={result.breakdown.skills}
              icon={<Wrench className="size-4" />}
            />
            <CriteriaBar
              label="Niveau / dossier"
              score={result.breakdown.levelDegree}
              icon={<GraduationCap className="size-4" />}
            />
          </div>
        </div>
      </Card>

      <CompatibilityExplanation aid={aid} />
      <ActionPlan actions={aid.actions} />
      <StrengthsGaps strengths={result.strengths} gaps={result.gaps} />

      <Card>
        <h2 className="mb-1 text-base font-semibold text-slate-900">Correspondance des matières</h2>
        <p className="mb-5 text-sm text-slate-500">
          Comparaison entre vos matières/compétences et les exigences de la formation.
        </p>
        <MatchTable matches={result.matches} />
      </Card>

      <EligibilitySection formation={formation} />

      <OfficialSourceCard formation={formation} />

      <ResultFeedback formationId={formation.id} score={result.overallScore} />

      <p className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
        Ce score ne garantit pas l&apos;admission et n&apos;est pas une probabilité d&apos;acceptation :
        il mesure une adéquation académique entre votre parcours et le contenu affiché de cette
        formation{formation.demo ? " de démonstration" : ""}. Vérifiez toujours la source officielle
        avant de candidater.
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
