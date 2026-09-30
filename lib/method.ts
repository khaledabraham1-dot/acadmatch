import { FORMATIONS } from "@/data/formations";
import { SELECTIVITY } from "@/data/selectivity";
import { getCompatibilityLabel } from "@/lib/matching/labels";
import { EVIDENCE_CAP_BASE, EVIDENCE_CAP_PER_ITEM, EVIDENCE_FULL_ITEMS } from "@/lib/matching/engine";
import { mentionFor } from "@/lib/profile/grades";

/**
 * Faits affichés sur la page « Comment est calculé le score » (app/methode),
 * DÉRIVÉS du code du moteur plutôt que recopiés : si un seuil change, la page
 * change avec lui. Aucune valeur de cette page ne doit être écrite en dur.
 */

/** Seuils des libellés de compatibilité, lus en interrogeant getCompatibilityLabel. */
export function compatibilityLabelThresholds(): { label: string; min: number }[] {
  const thresholds: { label: string; min: number }[] = [];
  for (let score = 100; score >= 0; score--) {
    const { label } = getCompatibilityLabel(score);
    const last = thresholds[thresholds.length - 1];
    if (last?.label === label) last.min = score;
    else thresholds.push({ label, min: score });
  }
  return thresholds;
}

/** Seuils des mentions (sur 20), lus en interrogeant mentionFor. */
export function mentionThresholds(): { mention: string; min: number }[] {
  const thresholds: { mention: string; min: number }[] = [];
  for (let tenth = 200; tenth >= 0; tenth--) {
    const value = tenth / 10;
    const mention = mentionFor(value);
    const last = thresholds[thresholds.length - 1];
    if (last?.mention === mention) last.min = value;
    else thresholds.push({ mention, min: value });
  }
  return thresholds;
}

/** Plafond du score selon le nombre de preuves reconnues (0 à EVIDENCE_FULL_ITEMS - 1). */
export function evidenceCapTable(): { evidence: number; cap: number }[] {
  return Array.from({ length: EVIDENCE_FULL_ITEMS }, (_, evidence) => ({
    evidence,
    cap: EVIDENCE_CAP_BASE + EVIDENCE_CAP_PER_ITEM * evidence,
  }));
}

/** Ce que couvrent les données aujourd'hui. */
export function catalogueFacts() {
  const real = FORMATIONS.filter((formation) => !formation.demo);
  const kinds = Object.values(SELECTIVITY).map((entry) => entry.kind);
  return {
    formations: real.length,
    countries: [...new Set(real.map((formation) => formation.institution.country))],
    withOfficialRate: kinds.filter((kind) => kind === "mon-master" || kind === "parcoursup").length,
    openAccessOrExam: kinds.filter((kind) => kind === "open-access" || kind === "entrance-exam").length,
    notPublished: kinds.filter((kind) => kind === "not-published" || kind === "on-file").length,
  };
}
