/**
 * Santé du catalogue pour l'espace admin (2026-10-06) : ce qu'il faut
 * revérifier, calculé depuis les données elles-mêmes (rien à tenir à jour).
 */
import type { StudyProgram } from "@/types";
import type { OfficialCampaign } from "@/data/campaigns";
import type { TuitionFee } from "@/data/budget";
import { VERIFICATION_MAX_AGE_DAYS } from "@/lib/data/integrity";
import { targetIntake } from "@/lib/campaigns";
import { currentAcademicYear } from "@/lib/admin/stats";

const DAY = 24 * 60 * 60 * 1000;
/** Une fiche est signalée un mois avant de devenir « à revérifier ». */
const WARNING_DAYS = 30;

export interface HealthItem { id: string; label: string; detail: string; overdue: boolean }

export function staleFormations(formations: StudyProgram[], now: Date): HealthItem[] {
  return formations
    .filter((f) => !f.demo)
    .map((f) => {
      const age = Math.floor((now.getTime() - new Date(`${f.verifiedAt ?? "1970-01-01"}T00:00:00Z`).getTime()) / DAY);
      return { f, age };
    })
    .filter(({ f, age }) => f.verificationStatus === "à revérifier" || age > VERIFICATION_MAX_AGE_DAYS - WARNING_DAYS)
    .sort((a, b) => b.age - a.age)
    .map(({ f, age }) => ({
      id: f.id,
      label: `${f.name}, ${f.institution.name}`,
      detail: `Vérifiée le ${f.verifiedAt ?? "?"} (il y a ${age} jours)`,
      overdue: f.verificationStatus === "à revérifier" || age > VERIFICATION_MAX_AGE_DAYS,
    }));
}

/** Calendriers dont la rentrée est passée : leurs dates ne sont plus qu'indicatives. */
export function outdatedCampaigns(campaigns: OfficialCampaign[], now: Date): HealthItem[] {
  const intake = targetIntake(now.toISOString().slice(0, 10));
  return campaigns
    .filter((c) => c.intake < intake)
    .map((c) => ({ id: c.id, label: c.name, detail: `Rentrée ${c.intake} (vérifié le ${c.verifiedAt}) : ${c.nextCalendarNote}`, overdue: true }));
}

/** Frais dont l'année universitaire est antérieure à l'année en cours. */
export function outdatedFees(fees: Record<string, TuitionFee>, formations: StudyProgram[], now: Date): HealthItem[] {
  const year = currentAcademicYear(now);
  return Object.entries(fees)
    .filter(([, fee]) => fee.eu.academicYear < year || (fee.nonEu !== null && fee.nonEu.academicYear < year))
    .map(([id, fee]) => {
      const f = formations.find((x) => x.id === id);
      return { id, label: f ? `${f.name}, ${f.institution.name}` : id, detail: `Frais ${fee.eu.academicYear} (année en cours : ${year})`, overdue: true };
    });
}
