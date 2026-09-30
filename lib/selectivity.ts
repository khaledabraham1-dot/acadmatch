import { SELECTIVITY, SELECTIVITY_SOURCES, type SelectivityData } from "@/data/selectivity";

/**
 * Niveau de sélectivité d'une formation, déduit des seules données
 * officielles (data/selectivity.ts). null = inconnu : aucun chiffre publié,
 * et on n'en invente pas.
 */
export type SelectivityTier = "très sélective" | "sélective" | "accessible";

/**
 * Libellés affichés. Volontairement différents de « sélective / non
 * sélective », qui a un sens juridique précis dans Parcoursup : une licence
 * « non sélective » peut n'accepter que 18 % des vœux faute de places.
 */
export const TIER_LABEL: Record<SelectivityTier, string> = {
  "très sélective": "Sélectivité forte",
  sélective: "Sélectivité moyenne",
  accessible: "Accès large",
};

/** Seuils sur la part de candidatures qui reçoivent une proposition (Mon Master) ou le taux d'accès (Parcoursup). */
const VERY_SELECTIVE_BELOW = 0.2;
const SELECTIVE_BELOW = 0.5;
/** En dessous, trop peu de candidats venant de l'étranger pour afficher une proportion qui ait un sens. */
export const MIN_FROM_ABROAD_CANDIDATES = 10;

export function selectivityOf(formationId: string): SelectivityData | null {
  return SELECTIVITY[formationId] ?? null;
}

/** Part de candidatures qui aboutissent à une proposition (0-1), ou null sans chiffre officiel. */
export function admissionRate(data: SelectivityData | null): number | null {
  if (!data) return null;
  if (data.kind === "mon-master") return data.candidates > 0 ? data.offers / data.candidates : null;
  if (data.kind === "parcoursup") return data.accessRate / 100;
  return null;
}

export function selectivityTier(data: SelectivityData | null): SelectivityTier | null {
  if (!data) return null;
  if (data.kind === "open-access" || data.kind === "entrance-exam") return "accessible";
  const rate = admissionRate(data);
  if (rate === null) return null;
  if (rate < VERY_SELECTIVE_BELOW) return "très sélective";
  if (rate < SELECTIVE_BELOW) return "sélective";
  return "accessible";
}

const percent = (value: number) => `${Math.round(value * 100)} %`;
const fr = (value: number) => value.toLocaleString("fr-FR");

export interface SelectivitySummary {
  tier: SelectivityTier | null;
  /** Phrase principale, avec les chiffres officiels. */
  headline: string;
  /** Détails utiles (candidats venant de l'étranger, capacité, précautions). */
  details: string[];
  sourceUrl: string | null;
  sourceLabel: string | null;
}

/** Texte affiché à l'étudiant : les chiffres officiels, leur année et leurs limites. */
export function summarizeSelectivity(data: SelectivityData | null): SelectivitySummary | null {
  if (!data) return null;
  const tier = selectivityTier(data);

  if (data.kind === "mon-master") {
    const details = [`${fr(data.capacity)} places annoncées.`];
    if (data.fromAbroadCandidates >= MIN_FROM_ABROAD_CANDIDATES) {
      details.push(
        `Candidats qui n'étaient pas inscrits dans le supérieur français l'année précédente (le plus souvent venant de l'étranger) : ${fr(data.fromAbroadOffers)} propositions pour ${fr(data.fromAbroadCandidates)} candidatures (${percent(data.fromAbroadOffers / data.fromAbroadCandidates)}).`,
      );
    }
    details.push("Un candidat peut postuler à plusieurs formations : c'est un indicateur de sélectivité, pas votre probabilité d'admission.");
    return {
      tier,
      headline: `En ${data.session}, ${fr(data.offers)} propositions pour ${fr(data.candidates)} candidatures (${percent(data.offers / data.candidates)}).`,
      details,
      sourceUrl: SELECTIVITY_SOURCES.monMaster,
      sourceLabel: `Mon Master, données officielles ${data.session}`,
    };
  }

  if (data.kind === "parcoursup") {
    return {
      tier,
      headline: `Taux d'accès Parcoursup ${data.session} : ${data.accessRate} % (${fr(data.applications)} vœux pour ${fr(data.capacity)} places).`,
      details: [
        data.selective
          ? "Formation sélective au sens de Parcoursup : admission sur examen du dossier."
          : "Formation « non sélective » au sens de Parcoursup : tout bachelier peut y prétendre, mais les places sont limitées et les candidats classés.",
        "Candidats hors Union européenne : l'entrée en première année passe le plus souvent par Études en France ou la demande d'admission préalable, pas par Parcoursup. Ce taux indique la sélectivité, pas votre chance d'admission.",
      ],
      sourceUrl: data.platformUrl,
      sourceLabel: `Fiche Parcoursup ${data.session}`,
    };
  }

  const headlines: Record<Exclude<SelectivityData["kind"], "mon-master" | "parcoursup">, string> = {
    "entrance-exam": "Accès sur examen d'entrée.",
    "open-access": "Accès ouvert, sans quota.",
    "on-file": "Admission sur dossier, sans taux publié.",
    "not-published": "Sélectivité non publiée.",
  };
  return { tier, headline: headlines[data.kind], details: [data.note], sourceUrl: null, sourceLabel: null };
}
