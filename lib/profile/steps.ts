/**
 * Profil en trois étapes (2026-10-02).
 *
 * Un formulaire unique de cinq blocs faisait remplir les champs optionnels
 * (diplôme exact, résultats, expériences) avant de voir le moindre résultat.
 * L'ordre suit désormais ce qu'un jury regarde d'abord : le parcours, puis ce
 * qui a été étudié — et c'est là, dès l'étape 2, qu'un premier résultat
 * provisoire apparaît. L'étape 3 affine, elle n'est jamais obligatoire.
 */

export type ProfileStep = 1 | 2 | 3;

/** `short` : libellé des écrans étroits (360 px), où le titre complet occupait quatre lignes. */
export const PROFILE_STEPS: { step: ProfileStep; title: string; short: string; hint: string }[] = [
  { step: 1, title: "Votre parcours", short: "Parcours", hint: "Niveau, domaine, objectif" },
  { step: 2, title: "Ce que vous avez étudié", short: "Études", hint: "Matières et compétences" },
  { step: 3, title: "Affiner", short: "Affiner", hint: "Résultats, expériences (optionnel)" },
];

export interface StepDraft {
  fieldOfStudy: string;
  languages: string[];
  courses: string[];
  skills: string[];
}

function hasContent(items: string[]): boolean {
  return items.some((item) => item.trim().length > 0);
}

/** Étape 1 complète : domaine choisi et au moins une langue. */
export function isPathStepComplete(draft: StepDraft): boolean {
  return draft.fieldOfStudy.trim().length > 0 && draft.languages.length > 0;
}

/**
 * Première étape qui bloque l'enregistrement, ou `null` si le profil est
 * enregistrable — mêmes règles que `validateProfileDraft`, ramenées à
 * l'étape où l'étudiant peut les corriger.
 */
export function firstBlockingStep(draft: StepDraft): ProfileStep | null {
  if (!isPathStepComplete(draft)) return 1;
  if (!hasContent(draft.courses) && !hasContent(draft.skills)) return 2;
  return null;
}

/**
 * On ne saute pas l'étape 1 : sans domaine, les suggestions de matières de
 * l'étape 2 seraient vides et l'aperçu provisoire n'aurait aucun sens.
 */
export function canOpenStep(step: ProfileStep, draft: StepDraft): boolean {
  return step === 1 || isPathStepComplete(draft);
}
