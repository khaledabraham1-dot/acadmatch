"use client";

import { useState } from "react";
import { MapPin, GraduationCap, ChevronDown, ArrowRight } from "lucide-react";
import type { Formation } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { getCompatibilityLabel } from "@/lib/matching/labels";
import { cn } from "@/lib/utils";

interface FormationCardProps {
  formation: Formation;
  /** Score déjà calculé côté page (null si aucun profil n'est encore renseigné). */
  score: number | null;
}

export function FormationCard({ formation, score }: FormationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const compat = score !== null ? getCompatibilityLabel(score) : null;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{formation.level}</Badge>
              <Badge tone="neutral">{formation.field}</Badge>
              {formation.language !== "Français" && <Badge tone="neutral">{formation.language}</Badge>}
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{formation.name}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
              <GraduationCap className="size-4" />
              {formation.institution}
              <span className="text-slate-300">·</span>
              <MapPin className="size-4" />
              {formation.city}
            </p>
          </div>

          {compat && score !== null ? (
            <div className="text-right">
              <Badge tone={compat.tone}>{compat.label}</Badge>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{score}%</p>
            </div>
          ) : (
            <Badge tone="neutral">Profil requis</Badge>
          )}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">{formation.description}</p>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Voir les prérequis et le contenu
          <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </button>

        {expanded && (
          <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Prérequis
              </p>
              <ul className="space-y-1 text-sm text-slate-600">
                {formation.prerequisites.map((req) => (
                  <li key={req.id}>{req.label}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Matières importantes
              </p>
              <ul className="space-y-1 text-sm text-slate-600">
                {formation.coreCourses.map((subject) => (
                  <li key={subject.id}>{subject.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Compétences demandées
              </p>
              <ul className="space-y-1 text-sm text-slate-600">
                {formation.skills.map((skill) => (
                  <li key={skill.id}>{skill.name}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        {/* Texte, pas un lien : cette URL est fictive et ne mène nulle part. */}
        <span
          className="block truncate text-xs text-slate-400"
          title={`URL fictive de démonstration : ${formation.source}`}
        >
          Source (démo) : {formation.source.replace("https://", "")}
        </span>
        <LinkButton
          href={`/resultat?formationId=${formation.id}`}
          size="sm"
          variant="outline"
          className="shrink-0 self-start sm:self-auto"
        >
          Voir la compatibilité
          <ArrowRight className="size-3.5" />
        </LinkButton>
      </div>
    </Card>
  );
}
