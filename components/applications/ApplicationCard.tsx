"use client";

import Link from "next/link";
import { MapPin, Trash2 } from "lucide-react";
import type { Application, StudyProgram } from "@/types";
import { APPLICATION_STATUSES } from "@/types";
import {
  addChecklistItem,
  applicationStatusTone,
  removeChecklistItem,
  setChecklistItemDueDate,
  toggleChecklistItem,
} from "@/lib/applications";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select, Textarea } from "@/components/ui/Field";
import { ChecklistEditor } from "@/components/applications/ChecklistEditor";

interface ApplicationCardProps {
  application: Application;
  formation: StudyProgram;
  onChange: (next: Application) => void;
  onRemove: (formationId: string) => void;
}

/** Une candidature suivie : statut, échéance personnelle, documents, prochaines actions, notes. */
export function ApplicationCard({ application, formation, onChange, onRemove }: ApplicationCardProps) {
  const tone = applicationStatusTone(application.status);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone={tone}>{application.status}</Badge>
          <h3 className="mt-1.5 font-semibold text-slate-900">
            <Link href={`/resultat?formationId=${formation.id}`} className="hover:text-blue-700">
              {formation.name}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
            {formation.institution.name}
            <span className="text-slate-300">·</span>
            <MapPin className="size-3.5" />
            {formation.institution.city}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(formation.id)}
          aria-label="Retirer le suivi de cette candidature"
          className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Statut
          </label>
          <Select
            value={application.status}
            onChange={(e) =>
              onChange({ ...application, status: e.target.value as Application["status"] })
            }
          >
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Échéance personnelle (rappel)
          </label>
          <input
            type="date"
            value={application.deadline ?? ""}
            onChange={(e) => onChange({ ...application, deadline: e.target.value || undefined })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="mt-1 text-xs text-slate-400">
            Un rappel que vous vous fixez — pas la date limite officielle. Vérifiez toujours la source de la
            formation.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Documents
          </label>
          <ChecklistEditor
            items={application.documents}
            placeholder="Ajouter un document…"
            emptyLabel="Aucun document listé pour l'instant."
            onAdd={(label) => onChange({ ...application, documents: addChecklistItem(application.documents, label) })}
            onToggle={(id) =>
              onChange({ ...application, documents: toggleChecklistItem(application.documents, id) })
            }
            onRemove={(id) =>
              onChange({ ...application, documents: removeChecklistItem(application.documents, id) })
            }
            onSetDueDate={(id, date) =>
              onChange({ ...application, documents: setChecklistItemDueDate(application.documents, id, date) })
            }
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Prochaines actions
          </label>
          <ChecklistEditor
            items={application.nextActions}
            placeholder="Ajouter une action…"
            emptyLabel="Aucune action listée pour l'instant."
            onAdd={(label) =>
              onChange({ ...application, nextActions: addChecklistItem(application.nextActions, label) })
            }
            onToggle={(id) =>
              onChange({ ...application, nextActions: toggleChecklistItem(application.nextActions, id) })
            }
            onRemove={(id) =>
              onChange({ ...application, nextActions: removeChecklistItem(application.nextActions, id) })
            }
            onSetDueDate={(id, date) =>
              onChange({ ...application, nextActions: setChecklistItemDueDate(application.nextActions, id, date) })
            }
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Notes
        </label>
        <Textarea
          value={application.notes}
          onChange={(e) => onChange({ ...application, notes: e.target.value })}
          placeholder="Vos notes personnelles sur cette candidature…"
          className="min-h-16"
        />
      </div>
    </Card>
  );
}
