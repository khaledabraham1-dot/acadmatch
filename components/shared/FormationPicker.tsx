"use client";

import { useState, type ReactNode } from "react";
import { getFormationById } from "@/data/formations";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";

/**
 * Choix d'une formation parmi celles que l'étudiant cible (candidatures
 * suivies, formations sauvegardées…) avant d'ouvrir un outil qui porte sur
 * une formation précise (lettre, entretien, budget).
 */
export function FormationPicker({
  formationIds,
  basePath,
  title = "Choisissez une formation",
  description,
  emptyState,
}: {
  formationIds: string[];
  basePath: string;
  title?: string;
  description: ReactNode;
  emptyState: ReactNode;
}) {
  const [picked, setPicked] = useState("");
  const formations = formationIds.map(getFormationById).filter((f) => f !== undefined);

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mb-4 text-sm text-slate-500">{description}</p>
      {formations.length > 0 ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <Select value={picked} onChange={(e) => setPicked(e.target.value)} aria-label="Formation">
              <option value="">Choisissez une formation…</option>
              {formations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.institution.name}
                </option>
              ))}
            </Select>
          </div>
          <LinkButton
            href={picked ? `${basePath}?formationId=${picked}` : "#"}
            size="md"
            className={!picked ? "pointer-events-none opacity-50" : undefined}
          >
            Continuer
          </LinkButton>
        </div>
      ) : (
        emptyState
      )}
    </Card>
  );
}
