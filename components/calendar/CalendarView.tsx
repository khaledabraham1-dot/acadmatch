"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Circle } from "lucide-react";
import type { Application } from "@/types";
import { FORMATIONS } from "@/data/formations";
import { loadApplications, upsertApplication } from "@/lib/storage";
import {
  buildCalendarEntries,
  formatCalendarDate,
  groupEntriesByDate,
  isOverdue,
  type CalendarEntry,
} from "@/lib/calendar";
import { toggleChecklistItem } from "@/lib/applications";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<CalendarEntry["source"], string> = {
  deadline: "Échéance",
  document: "Document",
  nextAction: "Action",
};

/**
 * Calendrier personnalisé (Phase 14) — voir lib/calendar.ts pour la
 * discipline "dates non vérifiées" et "fuseaux horaires" appliquée ici.
 * Toute entrée provient d'un rappel que l'étudiant s'est fixé lui-même
 * (échéance de candidature ou date sur un élément de checklist) : jamais
 * une date officielle affirmée par AcadMatch.
 */
export function CalendarView() {
  const [ready, setReady] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApplications(loadApplications());
    setReady(true);
  }, []);

  const grouped = useMemo(() => {
    const entries = buildCalendarEntries(applications, FORMATIONS);
    return groupEntriesByDate(entries);
  }, [applications]);

  function handleToggle(entry: CalendarEntry) {
    if (!entry.itemId) return; // une échéance n'est pas cochable, seuls documents/actions le sont
    const application = applications.find((a) => a.formationId === entry.formationId);
    if (!application) return;
    const next: Application =
      entry.source === "document"
        ? { ...application, documents: toggleChecklistItem(application.documents, entry.itemId) }
        : { ...application, nextActions: toggleChecklistItem(application.nextActions, entry.itemId) };
    setApplications(upsertApplication(next));
  }

  if (!ready) return null;

  const dates = [...grouped.keys()];

  return (
    <div className="space-y-6">
      <Card className="border-blue-100 bg-blue-50/60">
        <p className="text-sm text-blue-800">
          Ce calendrier réunit les rappels que <strong>vous</strong> vous fixez (échéances personnelles et dates
          sur vos documents/actions, depuis{" "}
          <Link href="/candidatures" className="font-medium underline underline-offset-2">
            le suivi des candidatures
          </Link>
          ) — AcadMatch n&apos;affirme aucune date limite officielle. Vérifiez toujours la source de chaque
          formation.
        </p>
      </Card>

      {dates.length === 0 ? (
        <Card className="border-dashed text-center">
          <p className="text-sm text-slate-400">
            Aucun rappel pour l&apos;instant. Ajoutez une échéance personnelle ou une date sur un document/une
            action depuis{" "}
            <Link href="/candidatures" className="font-medium text-blue-600 hover:text-blue-700">
              le suivi des candidatures
            </Link>
            .
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {dates.map((date) => (
            <div key={date}>
              <h2 className="mb-2 text-sm font-semibold capitalize text-slate-700">{formatCalendarDate(date)}</h2>
              <div className="space-y-2">
                {grouped.get(date)!.map((entry) => {
                  const overdue = isOverdue(entry);
                  const toggleable = Boolean(entry.itemId);
                  return (
                    <Card
                      key={`${entry.formationId}-${entry.source}-${entry.itemId ?? "deadline"}`}
                      className={cn(
                        "flex items-start gap-3 py-3",
                        overdue && "border-red-200 bg-red-50/40",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggle(entry)}
                        disabled={!toggleable}
                        aria-label={entry.done ? "Marquer comme non terminé" : "Marquer comme terminé"}
                        className={cn(
                          "mt-0.5 shrink-0",
                          toggleable ? "text-slate-400 hover:text-blue-600" : "cursor-default text-slate-300",
                        )}
                      >
                        {entry.done ? <CheckCircle2 className="size-5 text-emerald-600" /> : <Circle className="size-5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={overdue ? "danger" : "neutral"}>{SOURCE_LABEL[entry.source]}</Badge>
                          {overdue && (
                            <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                              <AlertTriangle className="size-3.5" />
                              En retard
                            </span>
                          )}
                        </div>
                        <p className={cn("mt-1 text-sm text-slate-800", entry.done && "text-slate-400 line-through")}>
                          {entry.label}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <CalendarClock className="size-3.5" />
                          <Link
                            href={`/resultat?formationId=${entry.formationId}`}
                            className="hover:text-blue-700"
                          >
                            {entry.formationName}
                          </Link>
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
