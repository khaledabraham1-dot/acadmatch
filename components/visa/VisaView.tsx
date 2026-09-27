"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarPlus, CheckCircle2, ExternalLink, Info, ShieldCheck } from "lucide-react";
import type { StudyProgram } from "@/types";
import { getFormationById } from "@/data/formations";
import { VISA_GUIDES_BY_COUNTRY, VISA_VERIFIED_AT, type VisaGuide } from "@/data/visa";
import { COUNTRY_BUDGET_RULES } from "@/data/budget";
import {
  type Citizenship,
  needsStudentVisa,
  OTHER_COUNTRY,
  stepsForRoute,
  type VisaAnswers,
  visaActionLabel,
  visaRoute,
} from "@/lib/visa";
import { computeBudget, formatEuros } from "@/lib/budget";
import { addChecklistLabelsOnce, createApplication } from "@/lib/applications";
import {
  loadApplications,
  loadBudgetPlan,
  loadSavedFormationIds,
  loadVisaAnswers,
  saveVisaAnswers,
  upsertApplication,
} from "@/lib/storage";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { FormationPicker } from "@/components/shared/FormationPicker";

/**
 * Parcours visa personnalisé (Phase 20, version légère) : besoin ou non
 * d'un visa, bon parcours selon le pays de résidence, étapes reliées à leur
 * source officielle, vérification des ressources à partir du budget
 * (Phase 19), et ajout des étapes au suivi de candidature (donc au
 * calendrier dès qu'une date leur est fixée).
 */
export function VisaView() {
  const searchParams = useSearchParams();
  const formationId = searchParams.get("formationId");
  const formation = formationId ? getFormationById(formationId) : undefined;

  const [hydrated, setHydrated] = useState(false);
  const [targetedIds, setTargetedIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<VisaAnswers | null>(null);

  const guide = formation ? VISA_GUIDES_BY_COUNTRY[formation.institution.country] : undefined;
  const countryOptions = residenceOptions(guide);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetedIds([...new Set([...loadSavedFormationIds(), ...loadApplications().map((a) => a.formationId)])]);
    setAnswers(loadVisaAnswers(ALL_RESIDENCE_OPTIONS));
    setHydrated(true);
  }, []);

  function updateAnswers(next: VisaAnswers) {
    setAnswers(next);
    saveVisaAnswers(next);
  }

  if (!hydrated) return null;

  if (!formation) {
    return (
      <FormationPicker
        formationIds={targetedIds}
        basePath="/visa"
        description="Les démarches dépendent du pays de la formation : choisissez-en une parmi vos formations sauvegardées ou vos candidatures."
        emptyState={
          <LinkButton href="/recherche" size="sm" variant="outline">
            Rechercher une formation
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Formation</p>
        <h2 className="mt-1 font-semibold text-slate-900">{formation.name}</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {formation.institution.name} · {formation.institution.city} ({formation.institution.country})
        </p>
      </Card>

      {!guide ? (
        <Card>
          <p className="text-sm text-slate-600">
            AcadMatch ne propose pas encore de guide visa pour ce pays. Renseignez-vous auprès de l&apos;ambassade
            du pays de destination.
          </p>
        </Card>
      ) : (
        <>
          <QuestionsCard
            guide={guide}
            answers={answers}
            countryOptions={countryOptions}
            onChange={updateAnswers}
          />
          {answers && <VisaRouteCards guide={guide} answers={answers} formation={formation} />}
        </>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        AcadMatch vous oriente et renvoie vers les sources officielles, vérifiées le{" "}
        {VISA_VERIFIED_AT.split("-").reverse().join("/")} ; il ne garantit aucune décision — elle appartient au
        consulat. Les pièces à fournir, délais et frais sont ceux indiqués par les sites officiels, qui font
        toujours foi.
      </p>
    </div>
  );
}

/**
 * Réponses communes à toutes les formations : on les valide contre tous les
 * pays connus, pas seulement ceux du guide affiché — sinon, sur une
 * formation belge (sans liste), modifier la nationalité effacerait le pays
 * de résidence utile pour une formation française.
 */
const ALL_RESIDENCE_OPTIONS = [
  ...new Set(Object.values(VISA_GUIDES_BY_COUNTRY).flatMap((g) => g.residenceProcedure?.countries ?? [])),
  OTHER_COUNTRY,
];

function residenceOptions(guide: VisaGuide | undefined): string[] {
  const countries = guide?.residenceProcedure?.countries ?? [];
  return [...[...countries].sort((a, b) => a.localeCompare(b, "fr")), OTHER_COUNTRY];
}

function QuestionsCard({
  guide,
  answers,
  countryOptions,
  onChange,
}: {
  guide: VisaGuide;
  answers: VisaAnswers | null;
  countryOptions: string[];
  onChange: (answers: VisaAnswers) => void;
}) {
  const citizenship = answers?.citizenship ?? "";
  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Votre situation</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="citizenship" className="mb-1.5 block text-sm font-medium text-slate-700">
            Nationalité
          </label>
          <Select
            id="citizenship"
            value={citizenship}
            onChange={(e) =>
              onChange({
                citizenship: e.target.value as Citizenship,
                residenceCountry: answers?.residenceCountry ?? "",
              })
            }
          >
            <option value="" disabled>
              Choisissez…
            </option>
            <option value="ue">UE / EEE / Suisse</option>
            <option value="hors-ue">Autre nationalité</option>
          </Select>
        </div>
        {answers?.citizenship === "hors-ue" && guide.residenceProcedure && (
          <div>
            <label htmlFor="residence" className="mb-1.5 block text-sm font-medium text-slate-700">
              Pays où vous résidez
            </label>
            <Select
              id="residence"
              value={answers.residenceCountry}
              onChange={(e) => onChange({ ...answers, residenceCountry: e.target.value })}
            >
              <option value="" disabled>
                Choisissez…
              </option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-xs text-slate-500">
              C&apos;est le pays de résidence, pas la nationalité, qui détermine la procédure.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function VisaRouteCards({
  guide,
  answers,
  formation,
}: {
  guide: VisaGuide;
  answers: VisaAnswers;
  formation: StudyProgram;
}) {
  const [added, setAdded] = useState(false);

  if (!needsStudentVisa(answers)) {
    return (
      <Card className="flex items-start gap-3 border-emerald-100 bg-emerald-50/60">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
        <div className="text-sm text-emerald-900">
          <p className="font-medium">Pas de visa étudiant à demander.</p>
          <p className="mt-1">
            Les ressortissants de l&apos;UE, de l&apos;EEE et de la Suisse n&apos;ont pas besoin de visa pour étudier en{" "}
            {guide.country}.{" "}
            <SourceLink href={guide.source} label="Source officielle" />
          </p>
        </div>
      </Card>
    );
  }

  if (guide.residenceProcedure && !answers.residenceCountry) return null;

  const route = visaRoute(guide, answers.residenceCountry);
  const steps = stepsForRoute(guide, route);

  function addToTracking() {
    const current =
      loadApplications().find((a) => a.formationId === formation.id) ?? createApplication(formation.id);
    upsertApplication({
      ...current,
      nextActions: addChecklistLabelsOnce(current.nextActions, steps.map(visaActionLabel), guide.source),
    });
    setAdded(true);
  }

  return (
    <>
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Titre à obtenir</p>
        <h2 className="mt-1 font-semibold text-slate-900">{guide.visaName}</h2>
        {guide.residenceProcedure && (
          <p className="mt-3 text-sm text-slate-600">
            {route === "etudes-en-france" ? (
              <>
                Vous résidez dans un pays relevant de la procédure{" "}
                <strong>« {guide.residenceProcedure.name} »</strong> : vos candidatures et votre demande de visa
                passent par cette plateforme.
              </>
            ) : (
              <>
                Votre pays de résidence ne relève pas de la procédure « {guide.residenceProcedure.name} » : vous
                faites directement votre demande de visa, une fois admis.
              </>
            )}{" "}
            <SourceLink
              href={guide.residenceProcedure.source}
              label={`Liste officielle des pays (${guide.residenceProcedure.sourceUpdatedAt.split("-").reverse().join("/")})`}
            />
          </p>
        )}
        {route === "etudes-en-france" && guide.residenceProcedure && (
          <p className="mt-2 text-xs text-slate-500">{guide.residenceProcedure.exception}</p>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Vos étapes</h2>
        <ol className="mt-4 space-y-4">
          {steps.map((step, index) => (
            <li key={step.id} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{step.title}</p>
                  <Badge tone={step.timing === "après l'arrivée" ? "warning" : "neutral"}>{step.timing}</Badge>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.description}</p>
                {step.resources && <ResourcesStatus formation={formation} />}
                <div className="mt-1.5">
                  <SourceLink href={step.link.url} label={step.link.label} />
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <Button type="button" size="sm" variant="outline" onClick={addToTracking}>
            <CalendarPlus className="size-3.5" />
            Ajouter ces étapes à mon suivi
          </Button>
          {added && (
            <p className="text-xs text-slate-600">
              Ajoutées aux actions de la candidature. Fixez-leur une date dans le{" "}
              <Link href="/candidatures" className="font-medium text-blue-600 hover:text-blue-700">
                suivi des candidatures
              </Link>{" "}
              pour les voir dans votre calendrier.
            </p>
          )}
        </div>
      </Card>
    </>
  );
}

/** Seuil de ressources du pays, et situation de l'étudiant s'il a rempli son budget (Phase 19). */
function ResourcesStatus({ formation }: { formation: StudyProgram }) {
  const minimum = COUNTRY_BUDGET_RULES[formation.institution.country]?.visaMonthlyMinimum;
  const plan = loadBudgetPlan(formation.id);
  if (!minimum) return null;

  // Un budget sans aucune ressource saisie n'est pas encore une réponse :
  // afficher « -99 € / mois pour vivre » inquiéterait sans rien apprendre.
  const summary = plan ? computeBudget(plan, formation, true) : null;
  const check = summary && summary.totalResourcesCents > 0 ? summary.visaCheck : null;
  const budgetHref = `/budget?formationId=${formation.id}`;

  return (
    <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <p>
        Minimum exigé : <strong>{formatEuros(minimum.cents)} / mois</strong>.
      </p>
      {check ? (
        <p className={`mt-1 flex items-start gap-1.5 ${check.meetsMinimum ? "text-emerald-700" : "text-amber-700"}`}>
          {check.meetsMinimum ? (
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <span>
            D&apos;après votre budget : {formatEuros(check.availableMonthlyCents)} / mois pour vivre après scolarité
            et frais ponctuels — {check.meetsMinimum ? "au-dessus du minimum." : "en dessous du minimum."}{" "}
            <Link href={budgetHref} className="font-medium underline underline-offset-2">
              Voir mon budget
            </Link>
          </span>
        </p>
      ) : (
        <p className="mt-1 text-slate-600">
          <Link href={budgetHref} className="font-medium text-blue-600 hover:text-blue-700">
            {plan ? "Compléter mon budget" : "Calculer mon budget"}
          </Link>{" "}
          (vos ressources) pour vérifier si elles suffisent.
        </p>
      )}
    </div>
  );
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
    >
      {label}
      <ExternalLink className="size-3" aria-hidden />
    </Link>
  );
}
