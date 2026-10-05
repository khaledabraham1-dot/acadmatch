"use client";

import { useState } from "react";
import Link from "next/link";
import { BellPlus, Check, ExternalLink, Landmark } from "lucide-react";
import type { Application, StudyProgram } from "@/types";
import { EEF_GENERAL_SOURCE, type CampaignPhase } from "@/data/campaigns";
import {
  addCampaignReminders,
  groupByCampaign,
  residesInEefCountry,
  targetIntake,
  upcomingPhases,
  type CampaignGroup,
} from "@/lib/campaigns";
import { formatCalendarDate } from "@/lib/calendar";
import type { VisaAnswers } from "@/lib/visa";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function formatPhase(phase: CampaignPhase): string {
  return phase.start
    ? `du ${formatCalendarDate(phase.start)} au ${formatCalendarDate(phase.end)}`
    : formatCalendarDate(phase.end);
}

function FormationLinks({ formations, toSource = false }: { formations: StudyProgram[]; toSource?: boolean }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
      {formations.map((formation) =>
        toSource && !formation.demo ? (
          <li key={formation.id}>
            <a
              href={formation.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-800"
            >
              {formation.name}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </li>
        ) : (
          <li key={formation.id}>
            <Link href={`/resultat?formationId=${formation.id}`} className="font-bold text-blue-700 hover:text-blue-800">
              {formation.name}
            </Link>
          </li>
        ),
      )}
    </ul>
  );
}

/**
 * Calendriers officiels des candidatures suivies (2026-10-02), regroupés par
 * plateforme — voir lib/campaigns.ts pour savoir lequel s'applique et
 * data/campaigns.ts pour la règle de sourçage. Une date de campagne passée
 * est toujours affichée comme indicative, jamais transformable en rappel.
 */
export function OfficialCalendars({
  applications,
  formations,
  visa,
  today,
  onApplicationsChange,
}: {
  applications: Application[];
  formations: StudyProgram[];
  visa: VisaAnswers | null;
  today: string;
  onApplicationsChange: (next: Application[]) => void;
}) {
  const [added, setAdded] = useState<Set<string>>(new Set());
  const followed = formations.filter((f) => applications.some((a) => a.formationId === f.id));
  if (followed.length === 0) return null;

  const groups = groupByCampaign(followed, visa, today);
  const intake = targetIntake(today);
  const eefUnknown = residesInEefCountry(visa) === null && groups.some((g) => g.key === "parcoursup" || g.key === "monmaster");

  function addReminders(group: CampaignGroup) {
    if (!group.campaign) return;
    const phases = upcomingPhases(group, today);
    let next = applications;
    for (const formation of group.formations) {
      const application = next.find((a) => a.formationId === formation.id);
      if (!application) continue;
      const updated = { ...application, nextActions: addCampaignReminders(application.nextActions, group.campaign, phases) };
      next = next.map((a) => (a.formationId === formation.id ? updated : a));
    }
    onApplicationsChange(next);
    setAdded((prev) => new Set(prev).add(group.key));
  }

  return (
    <section aria-labelledby="official-calendars-title" className="space-y-3">
      <h2 id="official-calendars-title" className="flex items-center gap-2 text-base font-bold text-slate-900">
        <Landmark className="size-4 text-slate-500" aria-hidden />
        Calendriers officiels de vos candidatures
      </h2>

      {eefUnknown && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Vous résidez hors de l&apos;Union européenne ? Dans 73 pays, les candidatures en France passent par la
          procédure <strong>Études en France</strong> (Campus France), avec des dates limites bien plus tôt.{" "}
          <Link href="/visa" className="font-bold underline underline-offset-2">
            Indiquez votre pays de résidence
          </Link>{" "}
          pour voir le bon calendrier.
        </p>
      )}

      {groups.map((group) => {
        const upcoming = upcomingPhases(group, today);
        if (group.key === "institution") {
          return (
            <Card key={group.key}>
              <h3 className="font-bold text-slate-900">Calendrier propre à l&apos;établissement</h3>
              <p className="mt-1 text-sm text-slate-600">
                Ces formations ne passent pas par une plateforme nationale : chaque établissement fixe ses dates.
                Vérifiez-les sur la page officielle.
              </p>
              <FormationLinks formations={group.formations} toSource />
            </Card>
          );
        }
        if (group.key === "eef-generic") {
          return (
            <Card key={group.key}>
              <h3 className="font-bold text-slate-900">Études en France ({visa?.residenceCountry})</h3>
              <p className="mt-1 text-sm text-slate-600">
                Vous résidez dans un pays « Études en France » : ces candidatures passent par Campus France, et non
                par Parcoursup ou Mon Master. Les dates limites sont fixées par votre Espace Campus France, souvent dès
                novembre ou décembre. AcadMatch n&apos;a pas encore relevé celles de votre pays.
              </p>
              <a
                href={EEF_GENERAL_SOURCE}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-800"
              >
                Trouver l&apos;Espace Campus France de mon pays
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
              <FormationLinks formations={group.formations} />
            </Card>
          );
        }

        const campaign = group.campaign!;
        return (
          <Card key={group.key}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900">{campaign.name}</h3>
              <Badge tone={group.official ? "success" : "warning"}>
                {group.official ? `Officiel · rentrée ${campaign.intake}` : `Indicatif · dates ${campaign.intake}`}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-600">{campaign.audience}</p>
            {!group.official && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
                Le calendrier de la rentrée {intake} n&apos;est pas encore publié. {campaign.nextCalendarNote} Les
                dates ci-dessous sont celles de la rentrée {campaign.intake} : un ordre de grandeur, pas une échéance.
              </p>
            )}
            <ul className="mt-3 divide-y divide-slate-100">
              {campaign.phases.map((phase) => {
                // Échéance passée d'un calendrier officiel : grisée, pour que l'œil aille à la suivante.
                const past = group.official && phase.end < today;
                return (
                  <li
                    key={phase.label}
                    className={cn("flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-2 text-sm", past && "text-slate-500")}
                  >
                    <span className={past ? undefined : "text-slate-800"}>
                      {phase.label}
                      {past && " (passé)"}
                    </span>
                    <span className={past ? undefined : "font-semibold text-slate-900"}>{formatPhase(phase)}</span>
                  </li>
                );
              })}
            </ul>
            <FormationLinks formations={group.formations} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <a
                href={campaign.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
              >
                Source : {campaign.sourceLabel} · vérifiée le {formatCalendarDate(campaign.verifiedAt)}
                <ExternalLink className="size-3" aria-hidden />
              </a>
              {upcoming.length > 0 &&
                (added.has(group.key) ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700" role="status">
                    <Check className="size-4" aria-hidden />
                    Ajoutées à vos rappels
                  </span>
                ) : (
                  <Button type="button" size="sm" variant="outline" onClick={() => addReminders(group)}>
                    <BellPlus className="size-4" aria-hidden />
                    Ajouter les {upcoming.length} échéances à mes rappels
                  </Button>
                ))}
            </div>
          </Card>
        );
      })}
    </section>
  );
}
