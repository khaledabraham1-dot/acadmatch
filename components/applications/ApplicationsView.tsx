"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { Application } from "@/types";
import { FORMATIONS, getFormationById } from "@/data/formations";
import { deleteApplication, loadApplications, upsertApplication } from "@/lib/storage";
import { createApplication, sortApplicationsByUrgency } from "@/lib/applications";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { ApplicationCard } from "@/components/applications/ApplicationCard";

/**
 * Suivi des candidatures (Phase 13). Persistance locale uniquement
 * (lib/storage.ts, même schéma défensif que le profil/les sauvegardes) —
 * pas de compte requis, pas de notifications (hors périmètre de cette phase).
 */
export function ApplicationsView() {
  const [ready, setReady] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [pickedFormationId, setPickedFormationId] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApplications(loadApplications());
    setReady(true);
  }, []);

  const trackedIds = new Set(applications.map((a) => a.formationId));
  const availableFormations = FORMATIONS.filter((f) => !trackedIds.has(f.id));

  const sorted = useMemo(() => sortApplicationsByUrgency(applications), [applications]);

  function handleAdd() {
    if (!pickedFormationId) return;
    setApplications(upsertApplication(createApplication(pickedFormationId)));
    setPickedFormationId("");
  }

  function handleChange(next: Application) {
    setApplications(upsertApplication(next));
  }

  function handleRemove(formationId: string) {
    setApplications(deleteApplication(formationId));
  }

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Suivre une nouvelle candidature</label>
          {availableFormations.length > 0 ? (
            <Select value={pickedFormationId} onChange={(e) => setPickedFormationId(e.target.value)}>
              <option value="">Choisissez une formation…</option>
              {availableFormations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.institution.name}
                </option>
              ))}
            </Select>
          ) : (
            <p className="text-sm text-slate-400">Toutes les formations du catalogue sont déjà suivies.</p>
          )}
        </div>
        <Button type="button" onClick={handleAdd} disabled={!pickedFormationId}>
          <Plus className="size-4" />
          Ajouter
        </Button>
      </Card>

      {sorted.length === 0 ? (
        <Card className="border-dashed text-center">
          <p className="text-sm text-slate-400">
            Aucune candidature suivie pour l&apos;instant. Choisissez une formation ci-dessus pour commencer.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((application) => {
            const formation = getFormationById(application.formationId);
            if (!formation) return null;
            return (
              <ApplicationCard
                key={application.formationId}
                application={application}
                formation={formation}
                onChange={handleChange}
                onRemove={handleRemove}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
