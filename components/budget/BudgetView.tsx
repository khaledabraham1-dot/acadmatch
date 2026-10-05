"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ExternalLink, Info } from "lucide-react";
import type { BudgetPlan, StudyProgram } from "@/types";
import { getFormationById } from "@/data/formations";
import { BUDGET_HINTS, FIXED_EURO_PARITIES, FLOATING_CURRENCIES } from "@/data/budget";
import {
  type AmountKind,
  type BudgetLine,
  type BudgetSummary,
  centsToInput,
  clampMonths,
  computeBudget,
  convertFromEuroCents,
  createBudgetPlan,
  formatCurrency,
  formatEuros,
  MAX_MONTHS,
  MIN_MONTHS,
  parseEurosToCents,
  targetYearOptions,
} from "@/lib/budget";
import { loadApplications, loadBudgetPlan, loadSavedFormationIds, saveBudgetPlan } from "@/lib/storage";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { FormationPicker } from "@/components/shared/FormationPicker";
import { cn } from "@/lib/utils";

const KIND_TONES: Record<AmountKind, "success" | "info" | "neutral"> = {
  officiel: "success",
  estimation: "info",
  hypothèse: "neutral",
};

const KIND_HELP: Record<AmountKind, string> = {
  officiel: "publié par une source officielle pour l'année visée",
  estimation: "montant officiel d'une autre année ou publié à titre indicatif",
  hypothèse: "montant que vous saisissez",
};

/**
 * Calculateur de budget (Phase 19). Coûts officiels sourcés (data/budget.ts)
 * et hypothèses de l'étudiant, toujours distingués ; calculs en centimes
 * (lib/budget.ts) ; budget enregistré par formation sur cet appareil.
 */
export function BudgetView() {
  const searchParams = useSearchParams();
  const formationId = searchParams.get("formationId");
  const formation = formationId ? getFormationById(formationId) : undefined;

  const [hydrated, setHydrated] = useState(false);
  const [targetedIds, setTargetedIds] = useState<string[]>([]);
  const [plan, setPlan] = useState<BudgetPlan | null>(null);

  useEffect(() => {
    // localStorage n'existe qu'après le montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetedIds([...new Set([...loadSavedFormationIds(), ...loadApplications().map((a) => a.formationId)])]);
    setPlan(formationId ? (loadBudgetPlan(formationId) ?? createBudgetPlan(formationId, new Date())) : null);
    setHydrated(true);
  }, [formationId]);

  function update(patch: Partial<BudgetPlan>) {
    if (!plan) return;
    const next = { ...plan, ...patch };
    setPlan(next);
    saveBudgetPlan(next);
  }

  // Entre un changement de formation (navigation client) et l'effet qui
  // charge son budget, `plan` est encore celui de la formation précédente.
  if (!hydrated || (plan && formationId && plan.formationId !== formationId)) return null;

  if (!formation || !plan) {
    return (
      <FormationPicker
        formationIds={targetedIds}
        basePath="/budget"
        description="Le budget se calcule pour une formation précise, parmi vos formations sauvegardées ou vos candidatures."
        emptyState={
          <LinkButton href="/recherche" size="sm" variant="outline">
            Rechercher une formation
          </LinkButton>
        }
      />
    );
  }

  const summary = computeBudget(plan, formation);

  // `key` : les champs gardent leur saisie en état local — sans remontage,
  // passer d'une formation à l'autre afficherait les montants de la précédente.
  return (
    <div key={plan.formationId} className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Formation</p>
        <h2 className="mt-1 font-semibold text-slate-900">{formation.name}</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {formation.institution.name} · {formation.institution.city} ({formation.institution.country})
        </p>
      </Card>

      <SettingsCard plan={plan} onChange={update} />
      <OfficialCostsCard summary={summary} />
      <HypothesesCard plan={plan} onChange={update} formation={formation} />
      <SummaryCard summary={summary} plan={plan} />

      <p className="text-xs leading-relaxed text-slate-500">
        Budget indicatif pour préparer votre projet : il ne remplace ni les informations de l&apos;établissement,
        ni l&apos;examen de votre dossier de visa. Les montants officiels ont été vérifiés le 27/09/2026 ; la
        source fait toujours foi. Budget enregistré sur cet appareil.
      </p>
    </div>
  );
}

function SettingsCard({ plan, onChange }: { plan: BudgetPlan; onChange: (patch: Partial<BudgetPlan>) => void }) {
  const [monthsInput, setMonthsInput] = useState(String(plan.months));
  const years = targetYearOptions(new Date());
  const yearOptions = years.includes(plan.targetYear) ? years : [plan.targetYear, ...years];
  const currencyCode = plan.displayCurrency?.code ?? "EUR";
  const fixed = FIXED_EURO_PARITIES[currencyCode];

  function changeCurrency(code: string) {
    if (code === "EUR") return onChange({ displayCurrency: undefined });
    const parity = FIXED_EURO_PARITIES[code];
    onChange({ displayCurrency: { code, rate: parity?.rate ?? plan.displayCurrency?.rate ?? 1 } });
  }

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Paramètres</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="feeProfile" className="mb-1.5 block text-sm font-medium text-slate-700">
            Tarif applicable
          </label>
          <Select
            id="feeProfile"
            value={plan.feeProfile}
            onChange={(e) => onChange({ feeProfile: e.target.value as BudgetPlan["feeProfile"] })}
          >
            <option value="ue">UE / EEE / Suisse (ou assimilé)</option>
            <option value="hors-ue">Hors UE</option>
          </Select>
          <p className="mt-1.5 text-xs text-slate-500">
            Certaines situations donnent droit au tarif UE sans en avoir la nationalité (résidence fiscale en
            France depuis 2 ans, carte de résident, statut de réfugié…) : vérifiez auprès de l&apos;établissement.
          </p>
        </div>
        <div>
          <label htmlFor="targetYear" className="mb-1.5 block text-sm font-medium text-slate-700">
            Année visée
          </label>
          <Select id="targetYear" value={plan.targetYear} onChange={(e) => onChange({ targetYear: e.target.value })}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                Rentrée {y}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="months" className="mb-1.5 block text-sm font-medium text-slate-700">
            Durée couverte (mois)
          </label>
          <Input
            id="months"
            inputMode="numeric"
            value={monthsInput}
            onChange={(e) => {
              setMonthsInput(e.target.value);
              const value = Number(e.target.value);
              if (e.target.value.trim() && Number.isInteger(value) && value >= MIN_MONTHS && value <= MAX_MONTHS) {
                onChange({ months: value });
              }
            }}
            onBlur={() => {
              const months = clampMonths(Number(monthsInput));
              setMonthsInput(String(months));
              onChange({ months });
            }}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Dépenses et ressources mensuelles comptées sur cette durée (1 à {MAX_MONTHS} mois). Un loyer court
            souvent sur 12 mois, même si l&apos;année universitaire en compte 10.
          </p>
        </div>
        <div>
          <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-slate-700">
            Afficher aussi en
          </label>
          <Select id="currency" value={currencyCode} onChange={(e) => changeCurrency(e.target.value)}>
            <option value="EUR">Euros uniquement</option>
            <optgroup label="Parité fixe officielle">
              {Object.entries(FIXED_EURO_PARITIES).map(([code, p]) => (
                <option key={code} value={code}>
                  {p.label} ({code})
                </option>
              ))}
            </optgroup>
            <optgroup label="Taux variable (à saisir)">
              {Object.entries(FLOATING_CURRENCIES).map(([code, label]) => (
                <option key={code} value={code}>
                  {label} ({code})
                </option>
              ))}
            </optgroup>
          </Select>
          {plan.displayCurrency && fixed && (
            <p className="mt-1.5 text-xs text-slate-500">
              Parité fixe : 1 € = {fixed.rate.toLocaleString("fr-FR")} {currencyCode}.{" "}
              <SourceLink href={fixed.source} label="Source officielle" />
            </p>
          )}
          {plan.displayCurrency && !fixed && (
            <RateInput
              code={currencyCode}
              rate={plan.displayCurrency.rate}
              onChange={(rate) => onChange({ displayCurrency: { code: currencyCode, rate } })}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

function RateInput({ code, rate, onChange }: { code: string; rate: number; onChange: (rate: number) => void }) {
  const [value, setValue] = useState(String(rate).replace(".", ","));
  const parsed = Number(value.replace(",", "."));
  const invalid = !(parsed > 0) || !Number.isFinite(parsed);
  return (
    <div className="mt-2">
      <label htmlFor="rate" className="mb-1 block text-xs font-medium text-slate-600">
        Votre taux : 1 € = … {code}
      </label>
      <Input
        id="rate"
        inputMode="decimal"
        value={value}
        aria-invalid={invalid}
        onChange={(e) => {
          setValue(e.target.value);
          const next = Number(e.target.value.replace(",", "."));
          if (next > 0 && Number.isFinite(next)) onChange(next);
        }}
      />
      <p className={cn("mt-1 text-xs", invalid ? "text-red-600" : "text-slate-500")}>
        {invalid
          ? "Saisissez un taux positif."
          : "Hypothèse : ce taux varie chaque jour, vérifiez-le auprès de votre banque avant tout transfert."}
      </p>
    </div>
  );
}

function OfficialCostsCard({ summary }: { summary: BudgetSummary }) {
  const official = summary.costs.filter((l) => l.kind !== "hypothèse");
  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-900">Coûts sourcés</h2>
      <p className="mt-0.5 text-xs text-slate-500">Frais de scolarité et frais obligatoires, avec leur source.</p>
      <ul className="mt-4 divide-y divide-slate-100">
        {official.map((line) => (
          <li key={line.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{line.label}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <KindBadge kind={line.kind} />
                  {line.source && (
                    <SourceLink href={line.source} label={`Source officielle · ${line.academicYear}`} />
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold tabular-nums text-slate-900">{formatEuros(line.cents)}</p>
            </div>
            {line.note && <p className="mt-2 text-xs leading-relaxed text-slate-500">{line.note}</p>}
          </li>
        ))}
      </ul>
      {summary.missingOfficialAmounts.map((message) => (
        <p
          key={message}
          className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {message}
        </p>
      ))}
    </Card>
  );
}

type MoneyGroup<K extends string> = { key: K; label: string; hint?: { text: string; source: string } }[];

const MONTHLY_COSTS: MoneyGroup<keyof BudgetPlan["monthlyCosts"]> = [
  { key: "housing", label: "Logement (loyer + charges)", hint: BUDGET_HINTS.housing },
  { key: "transport", label: "Transport" },
  { key: "food", label: "Alimentation", hint: BUDGET_HINTS.food },
  { key: "other", label: "Autres (téléphone, loisirs, santé…)" },
];
const ONE_OFF_COSTS: MoneyGroup<keyof BudgetPlan["oneOffCosts"]> = [
  { key: "administrative", label: "Frais administratifs (visa, candidature, traductions…)" },
  { key: "settling", label: "Installation (dépôt de garantie, équipement, billet d'avion…)" },
  { key: "other", label: "Autres coûts ponctuels" },
];
const MONTHLY_RESOURCES: MoneyGroup<keyof BudgetPlan["monthlyResources"]> = [
  { key: "scholarship", label: "Bourse" },
  { key: "family", label: "Aide familiale" },
  { key: "job", label: "Job étudiant" },
  { key: "other", label: "Autres ressources" },
];
const ONE_OFF_RESOURCES: MoneyGroup<keyof BudgetPlan["oneOffResources"]> = [
  { key: "savings", label: "Épargne disponible" },
  { key: "other", label: "Autres ressources ponctuelles" },
];

function HypothesesCard({
  plan,
  onChange,
  formation,
}: {
  plan: BudgetPlan;
  onChange: (patch: Partial<BudgetPlan>) => void;
  formation: StudyProgram;
}) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-900">Vos hypothèses</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Montants en euros que vous estimez vous-même. AcadMatch n&apos;affiche aucun loyer ni prix sans source :
        renseignez-vous sur place ({formation.institution.city}).
      </p>

      <MoneyFieldset
        legend={`Dépenses mensuelles (× ${plan.months} mois)`}
        fields={MONTHLY_COSTS}
        values={plan.monthlyCosts}
        onChange={(monthlyCosts) => onChange({ monthlyCosts })}
      />
      <MoneyFieldset
        legend="Dépenses ponctuelles"
        fields={ONE_OFF_COSTS}
        values={plan.oneOffCosts}
        onChange={(oneOffCosts) => onChange({ oneOffCosts })}
      />
      <MoneyFieldset
        legend={`Ressources mensuelles (× ${plan.months} mois)`}
        fields={MONTHLY_RESOURCES}
        values={plan.monthlyResources}
        onChange={(monthlyResources) => onChange({ monthlyResources })}
      />
      <MoneyFieldset
        legend="Ressources ponctuelles"
        fields={ONE_OFF_RESOURCES}
        values={plan.oneOffResources}
        onChange={(oneOffResources) => onChange({ oneOffResources })}
      />
    </Card>
  );
}

function MoneyFieldset<K extends string>({
  legend,
  fields,
  values,
  onChange,
}: {
  legend: string;
  fields: MoneyGroup<K>;
  values: Record<K, number>;
  onChange: (values: Record<K, number>) => void;
}) {
  return (
    <fieldset className="mt-5">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <MoneyInput
            key={field.key}
            label={field.label}
            hint={field.hint}
            cents={values[field.key]}
            onChange={(cents) => onChange({ ...values, [field.key]: cents })}
          />
        ))}
      </div>
    </fieldset>
  );
}

function MoneyInput({
  label,
  hint,
  cents,
  onChange,
}: {
  label: string;
  hint?: { text: string; source: string };
  cents: number;
  onChange: (cents: number) => void;
}) {
  const [value, setValue] = useState(centsToInput(cents));
  const invalid = parseEurosToCents(value) === null;
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          placeholder="0"
          value={value}
          aria-invalid={invalid}
          className="pr-8"
          onChange={(e) => {
            setValue(e.target.value);
            const parsed = parseEurosToCents(e.target.value);
            if (parsed !== null) onChange(parsed);
          }}
          onBlur={() => {
            const parsed = parseEurosToCents(value);
            if (parsed !== null) setValue(centsToInput(parsed));
          }}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">€</span>
      </div>
      {invalid && <p className="mt-1 text-xs text-red-600">Montant invalide (ex : 450 ou 450,50).</p>}
      {hint && !invalid && (
        <p className="mt-1 text-xs text-slate-500">
          {hint.text} <SourceLink href={hint.source} label="Source" />
        </p>
      )}
    </div>
  );
}

function SummaryCard({ summary, plan }: { summary: BudgetSummary; plan: BudgetPlan }) {
  const currency = plan.displayCurrency;
  const positive = summary.balanceCents >= 0;
  const incomplete = summary.missingOfficialAmounts.length > 0;

  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-900">Synthèse, rentrée {plan.targetYear}</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <SummaryRow label="Total des coûts" cents={summary.totalCostCents} currency={currency} strong />
        <div className="space-y-1 border-l-2 border-slate-100 pl-3">
          {(Object.keys(summary.costByKind) as AmountKind[]).map((kind) => (
            <SummaryRow
              key={kind}
              label={
                <span className="flex items-center gap-2">
                  <KindBadge kind={kind} />
                  <span className="text-xs text-slate-500">{KIND_HELP[kind]}</span>
                </span>
              }
              cents={summary.costByKind[kind]}
              currency={currency}
            />
          ))}
        </div>
        <SummaryRow label="Total des ressources" cents={summary.totalResourcesCents} currency={currency} strong />
        <div
          className={cn(
            "rounded-xl px-3 py-2",
            positive ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900",
          )}
        >
          <SummaryRow
            label={positive ? "Reste après toutes les dépenses" : "Il manque"}
            cents={Math.abs(summary.balanceCents)}
            currency={currency}
            strong
          />
        </div>
      </dl>
      {incomplete && (
        <p className="mt-3 text-xs text-amber-700">
          Total incomplet : un montant officiel n&apos;est pas publié (voir ci-dessus).
        </p>
      )}

      {summary.visaCheck && (
        <div
          className={cn(
            "mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
            summary.visaCheck.meetsMinimum
              ? "border-emerald-100 bg-emerald-50/60 text-emerald-900"
              : "border-amber-100 bg-amber-50/60 text-amber-900",
          )}
        >
          {summary.visaCheck.meetsMinimum ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <div>
            <p className="font-medium">
              Visa étudiant : {formatEuros(summary.visaCheck.availableMonthlyCents)} / mois pour vivre, pour un
              minimum exigé de {formatEuros(summary.visaCheck.requiredMonthlyCents)} / mois.
            </p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">
              Ressources restantes une fois payés la scolarité et les frais ponctuels, réparties sur {plan.months}{" "}
              mois. {summary.visaCheck.note} Indicatif : le consulat examine vos justificatifs réels.{" "}
              <SourceLink href={summary.visaCheck.source} label="Source officielle" />
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function SummaryRow({
  label,
  cents,
  currency,
  strong,
}: {
  label: React.ReactNode;
  cents: number;
  currency?: BudgetPlan["displayCurrency"];
  strong?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <dt className={strong ? "font-medium text-current" : "text-slate-600"}>{label}</dt>
      <dd className="text-right tabular-nums">
        <span className={strong ? "font-semibold" : undefined}>{formatEuros(cents)}</span>
        {currency && (
          <span className="block text-xs opacity-70">
            ≈ {formatCurrency(convertFromEuroCents(cents, currency.rate, currency.code), currency.code)}
          </span>
        )}
      </dd>
    </div>
  );
}

function KindBadge({ kind }: { kind: BudgetLine["kind"] }) {
  return <Badge tone={KIND_TONES[kind]}>{kind}</Badge>;
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
    >
      {label}
      <ExternalLink className="size-3" aria-hidden />
    </Link>
  );
}
