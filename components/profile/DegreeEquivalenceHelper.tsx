"use client";

import { useState } from "react";
import { ExternalLink, Globe2 } from "lucide-react";
import type { AcademicLevel } from "@/types";
import {
  ENIC_NARIC_URL,
  VALIDATED_YEARS_OPTIONS,
  estimateAcademicLevel,
} from "@/lib/profile/degreeEquivalence";
import { Label, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface DegreeEquivalenceHelperProps {
  /** Applique le niveau estimé au champ "Niveau actuel" du formulaire. */
  onApply: (level: AcademicLevel) => void;
}

/**
 * Aide facultative pour un étudiant dont le diplôme n'a pas été obtenu en
 * France : estime un niveau français à partir du nombre d'années d'études
 * supérieures validées (voir lib/profile/degreeEquivalence.ts). Repliée par
 * défaut pour ne pas alourdir le formulaire des étudiants français.
 */
export function DegreeEquivalenceHelper({ onApply }: DegreeEquivalenceHelperProps) {
  const [open, setOpen] = useState(false);
  const [years, setYears] = useState(3);
  const estimated = estimateAcademicLevel(years);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
      >
        <Globe2 className="size-3.5" aria-hidden />
        Diplôme obtenu hors de France ? Estimer mon niveau
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <Label htmlFor="validatedYears">Années d&apos;études supérieures validées depuis le secondaire</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          id="validatedYears"
          className="w-auto min-w-[260px] flex-1"
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
        >
          {VALIDATED_YEARS_OPTIONS.map((option) => (
            <option key={option.years} value={option.years}>
              {option.label}
            </option>
          ))}
        </Select>
        <Button type="button" size="sm" variant="outline" onClick={() => onApply(estimated)}>
          Utiliser « {estimated} »
        </Button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        Estimation indicative (Licence = Bac+3, Master = Bac+5 en France) — pas une équivalence
        officielle. Pour une reconnaissance officielle de votre diplôme, consultez le{" "}
        <a
          href={ENIC_NARIC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
        >
          centre ENIC-NARIC France
          <ExternalLink className="size-3" aria-hidden />
        </a>
        .
      </p>
    </div>
  );
}
