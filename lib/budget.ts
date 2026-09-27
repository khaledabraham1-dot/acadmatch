import type { BudgetPlan, StudyProgram } from "@/types";
import {
  COUNTRY_BUDGET_RULES,
  FIXED_EURO_PARITIES,
  TUITION_FEES,
  type OfficialAmount,
} from "@/data/budget";

/**
 * Calculateur de budget (Phase 19) — logique pure, testée. Sépare
 * systématiquement trois niveaux de fiabilité :
 *
 * - "officiel" : montant publié par une source officielle POUR l'année
 *   visée par l'étudiant ;
 * - "estimation" : montant officiel mais d'une autre année (les droits
 *   sont indexés chaque année — celui de l'année visée n'est souvent pas
 *   encore publié) ou publié "à titre indicatif" par l'établissement ;
 * - "hypothèse" : montant saisi par l'étudiant.
 *
 * Tous les calculs se font en centimes entiers : aucun arrondi flottant ne
 * s'accumule. Seule la conversion vers une autre devise arrondit, une
 * seule fois, à l'unité mineure de la devise cible.
 */

export type AmountKind = "officiel" | "estimation" | "hypothèse";

export interface BudgetLine {
  id: string;
  label: string;
  cents: number;
  kind: AmountKind;
  /** Nombre de fois où le montant est compté (mois), 1 pour un montant ponctuel. */
  multiplier: number;
  source?: string;
  academicYear?: string;
  note?: string;
}

export interface BudgetSummary {
  costs: BudgetLine[];
  resources: BudgetLine[];
  totalCostCents: number;
  totalResourcesCents: number;
  balanceCents: number;
  /** Total des coûts par niveau de fiabilité. */
  costByKind: Record<AmountKind, number>;
  /** Montant non publié (ex: contribution hors UE UCLouvain) : le total est alors incomplet. */
  missingOfficialAmounts: string[];
  visaCheck: VisaCheck | null;
}

export interface VisaCheck {
  requiredMonthlyCents: number;
  /** Ressources disponibles pour vivre, par mois, une fois payés scolarité et frais ponctuels. */
  availableMonthlyCents: number;
  meetsMinimum: boolean;
  source: string;
  note: string;
}

export const MIN_MONTHS = 1;
export const MAX_MONTHS = 24;
/** Plafond de saisie par montant (10 millions d'euros) — au-delà, c'est une erreur de frappe. */
export const MAX_AMOUNT_CENTS = 1_000_000_000;

/**
 * Rentrée que prépare un étudiant qui utilise AcadMatch aujourd'hui : les
 * candidatures pour une rentrée de septembre se jouent entre l'automne et
 * le printemps précédents. À partir de juillet, la rentrée imminente est
 * déjà jouée : on prépare la suivante.
 */
export function defaultTargetYear(now: Date): string {
  const start = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return `${start}-${start + 1}`;
}

export function targetYearOptions(now: Date): string[] {
  const first = Number(defaultTargetYear(now).slice(0, 4));
  return [first, first + 1].map((y) => `${y}-${y + 1}`);
}

export function createBudgetPlan(formationId: string, now: Date): BudgetPlan {
  return {
    formationId,
    feeProfile: "ue",
    targetYear: defaultTargetYear(now),
    months: 12,
    monthlyCosts: { housing: 0, transport: 0, food: 0, other: 0 },
    oneOffCosts: { administrative: 0, settling: 0, other: 0 },
    monthlyResources: { scholarship: 0, family: 0, job: 0, other: 0 },
    oneOffResources: { savings: 0, other: 0 },
  };
}

function officialKind(amount: OfficialAmount, targetYear: string): AmountKind {
  return amount.indicative || amount.academicYear !== targetYear ? "estimation" : "officiel";
}

function estimationNote(amount: OfficialAmount, targetYear: string): string | undefined {
  if (amount.indicative) return "Montant publié à titre indicatif par l'établissement.";
  if (amount.academicYear !== targetYear) {
    return `Dernier montant officiel publié (${amount.academicYear}) : celui de ${targetYear} peut différer (indexation annuelle).`;
  }
  return undefined;
}

function joinNotes(...notes: (string | undefined)[]): string | undefined {
  const kept = notes.filter(Boolean);
  return kept.length > 0 ? kept.join(" ") : undefined;
}

function officialLine(id: string, label: string, amount: OfficialAmount, targetYear: string, note?: string): BudgetLine {
  return {
    id,
    label,
    cents: amount.cents,
    kind: officialKind(amount, targetYear),
    multiplier: 1,
    source: amount.source,
    academicYear: amount.academicYear,
    note: joinNotes(estimationNote(amount, targetYear), note),
  };
}

function hypothesisLine(id: string, label: string, cents: number, multiplier: number): BudgetLine {
  return { id, label, cents, kind: "hypothèse", multiplier };
}

function lineTotal(line: BudgetLine): number {
  return line.cents * line.multiplier;
}

/**
 * `forceVisaCheck` : calcule la vérification visa quel que soit le tarif
 * choisi — la page Visa sait, elle, que l'étudiant a besoin d'un visa
 * (un étudiant hors UE « assimilé » paie le tarif UE mais peut en avoir
 * besoin).
 */
export function computeBudget(plan: BudgetPlan, formation: StudyProgram, forceVisaCheck = false): BudgetSummary {
  const months = clampMonths(plan.months);
  const costs: BudgetLine[] = [];
  const missingOfficialAmounts: string[] = [];

  const tuition = TUITION_FEES[formation.id];
  const tuitionLabel =
    tuition?.scope === "programme" ? "Frais de scolarité (programme complet)" : "Frais de scolarité (1 an)";
  if (tuition) {
    const amount = plan.feeProfile === "hors-ue" ? tuition.nonEu : tuition.eu;
    const profileNote = plan.feeProfile === "hors-ue" ? tuition.nonEuNote : undefined;
    if (amount) {
      costs.push(officialLine("tuition", tuitionLabel, amount, plan.targetYear, joinNotes(tuition.note, profileNote)));
    } else {
      missingOfficialAmounts.push(joinNotes(tuitionLabel + " :", profileNote) ?? tuitionLabel);
      // Le montant de base (UE) reste dû : seule la part supplémentaire est inconnue.
      costs.push(officialLine("tuition", tuitionLabel, tuition.eu, plan.targetYear, tuition.note));
    }
  } else {
    missingOfficialAmounts.push(`${tuitionLabel} : non encore sourcés pour cette formation dans AcadMatch.`);
  }

  const rules = COUNTRY_BUDGET_RULES[formation.institution.country];
  rules?.mandatoryFees.forEach((fee, i) => {
    costs.push(officialLine(`mandatory-${i}`, fee.label, fee.amount, plan.targetYear, fee.note));
  });

  costs.push(
    hypothesisLine("housing", "Logement", plan.monthlyCosts.housing, months),
    hypothesisLine("transport", "Transport", plan.monthlyCosts.transport, months),
    hypothesisLine("food", "Alimentation", plan.monthlyCosts.food, months),
    hypothesisLine("monthly-other", "Autres dépenses mensuelles", plan.monthlyCosts.other, months),
    hypothesisLine("administrative", "Frais administratifs (visa, dossiers…)", plan.oneOffCosts.administrative, 1),
    hypothesisLine("settling", "Installation (dépôt de garantie, équipement…)", plan.oneOffCosts.settling, 1),
    hypothesisLine("one-off-other", "Autres coûts ponctuels", plan.oneOffCosts.other, 1),
  );

  const resources: BudgetLine[] = [
    hypothesisLine("scholarship", "Bourse", plan.monthlyResources.scholarship, months),
    hypothesisLine("family", "Aide familiale", plan.monthlyResources.family, months),
    hypothesisLine("job", "Job étudiant", plan.monthlyResources.job, months),
    hypothesisLine("resource-other", "Autres ressources mensuelles", plan.monthlyResources.other, months),
    hypothesisLine("savings", "Épargne disponible", plan.oneOffResources.savings, 1),
    hypothesisLine("one-off-resource-other", "Autres ressources ponctuelles", plan.oneOffResources.other, 1),
  ];

  const totalCostCents = sum(costs.map(lineTotal));
  const totalResourcesCents = sum(resources.map(lineTotal));
  const costByKind: Record<AmountKind, number> = { officiel: 0, estimation: 0, hypothèse: 0 };
  for (const line of costs) costByKind[line.kind] += lineTotal(line);

  return {
    costs,
    resources,
    totalCostCents,
    totalResourcesCents,
    balanceCents: totalResourcesCents - totalCostCents,
    costByKind,
    missingOfficialAmounts,
    visaCheck: computeVisaCheck(plan, costs, totalResourcesCents, months, rules, forceVisaCheck),
  };
}

/**
 * Le seuil de ressources du visa porte sur les moyens de vivre sur place :
 * on le compare à ce qui reste des ressources une fois payés la scolarité
 * et les frais ponctuels — lecture volontairement prudente, puisque ces
 * frais sont dus de toute façon. Seulement pour un étudiant hors UE, le
 * seul concerné par un visa étudiant.
 */
function computeVisaCheck(
  plan: BudgetPlan,
  costs: BudgetLine[],
  totalResourcesCents: number,
  months: number,
  rules: (typeof COUNTRY_BUDGET_RULES)[string] | undefined,
  force: boolean,
): VisaCheck | null {
  if ((!force && plan.feeProfile !== "hors-ue") || !rules?.visaMonthlyMinimum) return null;
  const fixedCosts = sum(costs.filter((l) => l.multiplier === 1).map(lineTotal));
  const availableMonthlyCents = Math.floor((totalResourcesCents - fixedCosts) / months);
  return {
    requiredMonthlyCents: rules.visaMonthlyMinimum.cents,
    availableMonthlyCents,
    meetsMinimum: availableMonthlyCents >= rules.visaMonthlyMinimum.cents,
    source: rules.visaMonthlyMinimum.source,
    note: rules.visaMonthlyMinimum.note,
  };
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function clampMonths(months: number): number {
  if (!Number.isFinite(months)) return 12;
  return Math.min(MAX_MONTHS, Math.max(MIN_MONTHS, Math.round(months)));
}

/**
 * Saisie d'un montant en euros ("1 200", "1200,50", "1 200.5") → centimes.
 * null si la saisie n'est pas un montant positif valide. Les espaces (y
 * compris insécables, séparateur de milliers français) sont ignorés.
 */
export function parseEurosToCents(input: string): number | null {
  const normalized = input.replace(/[\s  €]/g, "").replace(",", ".");
  if (normalized === "") return 0;
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const [units, decimals = ""] = normalized.split(".");
  const cents = Number(units) * 100 + Number(decimals.padEnd(2, "0"));
  return cents <= MAX_AMOUNT_CENTS ? cents : null;
}

/** Centimes → valeur éditable ("1200,5" → "1200,50", 0 → ""). */
export function centsToInput(cents: number): string {
  if (cents === 0) return "";
  const units = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest === 0 ? String(units) : `${units},${String(rest).padStart(2, "0")}`;
}

/** Unité mineure d'une devise (2 pour l'euro, 0 pour le franc CFA). */
export function currencyDigits(code: string): number {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: code }).resolvedOptions()
    .maximumFractionDigits ?? 2;
}

/**
 * Convertit des centimes d'euro vers une autre devise, arrondi une seule
 * fois à l'unité mineure de la devise cible (au plus proche). Renvoie un
 * montant dans l'unité principale (ex: francs CFA, dirhams).
 */
export function convertFromEuroCents(cents: number, rate: number, code: string): number {
  const digits = currencyDigits(code);
  const factor = 10 ** digits;
  // Arrondi sur un entier de centimes × taux : évite l'accumulation d'erreurs
  // flottantes (ex: 877,50 € × 655,957 = 575 602,27 FCFA → 575 602).
  const minorUnits = Math.round((cents * rate * factor) / 100);
  return minorUnits / factor;
}

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatCurrency(amount: number, code: string): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: code }).format(amount);
}

/** Taux de conversion officiel fixe pour une devise, s'il existe. */
export function fixedParity(code: string): number | undefined {
  return FIXED_EURO_PARITIES[code]?.rate;
}
