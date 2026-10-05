/**
 * « Formation manquante ? » (2026-10-05) — demandes anonymes de formations
 * absentes du catalogue, envoyées dans la table `formation_requests`
 * (supabase/migrations/0006_formation_requests.sql).
 *
 * Elles disent quelles fiches ajouter en priorité : le catalogue est la
 * principale limite d'AcadMatch, autant le faire grandir là où les
 * étudiants le demandent. Aucun identifiant n'est envoyé : seuls la
 * demande, la recherche en cours et le domaine / niveau / diplôme visé du
 * profil l'accompagnent.
 */

import { createAnonymousQueue } from "@/lib/anonymousInsert";

export type RequestCountry = "France" | "Belgique" | "Autre";
export const REQUEST_COUNTRIES: RequestCountry[] = ["France", "Belgique", "Autre"];

export type RequestSource = "recherche-vide" | "recherche-liste" | "catalogue";

export interface FormationRequestPayload {
  wanted: string;
  institution: string;
  country: RequestCountry | null;
  source: RequestSource;
  searchQuery: string | null;
  profileField: string | null;
  profileLevel: string | null;
  profileGoal: string | null;
}

export const MIN_WANTED_LENGTH = 2;
export const MAX_WANTED_LENGTH = 200;
export const MAX_INSTITUTION_LENGTH = 160;

const clip = (value: string | null, max: number) => (value === null ? null : value.trim().slice(0, max) || null);

/** Vrai si la demande peut partir (assez précise pour être exploitable). */
export function isValidRequest(wanted: string): boolean {
  return wanted.trim().length >= MIN_WANTED_LENGTH;
}

/** Ligne de la table `formation_requests`, bornée comme les contraintes SQL. */
export function toFormationRequestRow(payload: FormationRequestPayload) {
  return {
    wanted: payload.wanted.trim().slice(0, MAX_WANTED_LENGTH),
    institution: clip(payload.institution, MAX_INSTITUTION_LENGTH),
    country: payload.country,
    source: payload.source,
    search_query: clip(payload.searchQuery, 120),
    profile_field: clip(payload.profileField, 80),
    profile_level: clip(payload.profileLevel, 40),
    profile_goal: clip(payload.profileGoal, 40),
  };
}

type FormationRequestRow = ReturnType<typeof toFormationRequestRow>;

const queue = createAnonymousQueue<FormationRequestRow>("formation_requests", "acadmatch:formation-requests");

export function sendFormationRequest(payload: FormationRequestPayload): Promise<"sent" | "queued"> {
  return queue.send(toFormationRequestRow(payload));
}

export function flushPendingFormationRequests(): Promise<void> {
  return queue.flush();
}
