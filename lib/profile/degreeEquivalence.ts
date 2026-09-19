import { ACADEMIC_LEVEL_ORDER, type AcademicLevel } from "@/types";

/**
 * Équivalence indicative "années d'études validées → niveau français"
 * (Étape 10 — suite du point "auto-évaluation du dossier").
 *
 * Un étudiant formé hors de France doit aujourd'hui deviner seul où son
 * diplôme se situe dans la nomenclature française (`AcademicLevel`). On lui
 * propose ici un point de départ, basé sur le nombre d'années d'études
 * supérieures validées depuis la fin du secondaire — pas sur un intitulé de
 * diplôme par pays (trop nombreux, et le libellé exact d'un même diplôme
 * varie d'un établissement à l'autre). C'est la méthode de première
 * évaluation la plus universelle : en France, Licence = Bac+3 et
 * Master = Bac+5, donc un parcours ayant validé N années s'aligne
 * naturellement sur le niveau français classé au rang N dans
 * `ACADEMIC_LEVEL_ORDER` (Baccalauréat=0 … Doctorat=6).
 *
 * ⚠️ Indicatif uniquement — ne remplace jamais une attestation de
 * comparabilité officielle. Voir `ENIC_NARIC_URL` : le centre ENIC-NARIC
 * France (opéré par France Éducation international) est le seul organisme
 * habilité à établir une équivalence officielle pour un diplôme précis.
 */

/** Rang du niveau le plus élevé de la nomenclature (Doctorat) — borne supérieure des années saisies. */
export const MAX_VALIDATED_YEARS = ACADEMIC_LEVEL_ORDER.length - 1;

/** URL officielle du centre ENIC-NARIC France (reconnaissance de diplômes étrangers). */
export const ENIC_NARIC_URL =
  "https://www.france-education-international.fr/expertises/enic-naric?langue=fr";

/**
 * Estime le niveau français correspondant à un nombre d'années d'études
 * supérieures validées. Fonction pure, bornée à [0, `MAX_VALIDATED_YEARS`] —
 * une saisie hors bornes ou non entière est ramenée à la valeur valide la
 * plus proche plutôt que de produire un résultat absurde.
 */
export function estimateAcademicLevel(validatedYears: number): AcademicLevel {
  const clamped = Math.min(Math.max(Math.round(validatedYears), 0), MAX_VALIDATED_YEARS);
  return ACADEMIC_LEVEL_ORDER[clamped];
}

/** Options du sélecteur "années validées" — le dernier libellé couvre le doctorat et au-delà. */
export const VALIDATED_YEARS_OPTIONS: { years: number; label: string }[] = [
  { years: 0, label: "0 — uniquement le diplôme de fin d'études secondaires" },
  { years: 1, label: "1 an" },
  { years: 2, label: "2 ans" },
  { years: 3, label: "3 ans (ex : Bachelor's degree standard)" },
  { years: 4, label: "4 ans (ex : Bachelor's degree, États-Unis/Canada/Inde)" },
  { years: 5, label: "5 ans (ex : Master's degree complet)" },
  { years: 6, label: "6 ans ou plus (doctorat en cours ou obtenu)" },
];
