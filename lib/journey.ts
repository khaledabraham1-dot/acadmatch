/**
 * Mesure anonyme du parcours (2026-10-05) — table `journey_events`
 * (supabase/migrations/0007_journey_events.sql).
 *
 * Compte les étapes clés (profil enregistré, résultat vu, relevé importé…)
 * pour savoir où les étudiants s'arrêtent. Aucune donnée personnelle :
 * ni identifiant, ni contenu du profil, et rien n'est écrit sur l'appareil
 * (pas de cookie, pas de localStorage) — seulement l'étape, un détail
 * technique facultatif (ex. le canal de partage) et le type d'appareil.
 *
 * Chaque étape n'est comptée qu'une fois par visite (mémoire de l'onglet),
 * pour qu'un résultat rouvert dix fois ne fausse pas l'entonnoir.
 */

import { postAnonymousRow } from "@/lib/anonymousInsert";

export const JOURNEY_STEPS = [
  "exemple-essaye",
  "profil-parcours",
  "profil-enregistre",
  "resultat-vu",
  "releve-importe",
  "candidature-ajoutee",
  "ia-utilisee",
  "partage",
] as const;

export type JourneyStep = (typeof JOURNEY_STEPS)[number];

const counted = new Set<string>();

export function journeyRow(step: JourneyStep, detail: string | null, mobile: boolean) {
  return { step, detail: detail ? detail.slice(0, 40) : null, device: mobile ? "mobile" : "ordinateur" };
}

/** Compte une étape (une fois par visite). Ne bloque jamais, n'échoue jamais. */
export function trackStep(step: JourneyStep, detail: string | null = null): void {
  if (typeof window === "undefined") return;
  const key = `${step}:${detail ?? ""}`;
  if (counted.has(key)) return;
  counted.add(key);
  const mobile = window.matchMedia?.("(max-width: 767px)").matches ?? false;
  void postAnonymousRow("journey_events", journeyRow(step, detail, mobile));
}

/** Pour les tests : oublie les étapes déjà comptées. */
export function resetCountedSteps(): void {
  counted.clear();
}
