import type { StudentProfile } from "@/types";

/**
 * Persistance locale (aucun compte, aucune base de données pour ce prototype).
 * Le profil et la formation sélectionnée voyagent d'une page à l'autre via
 * localStorage, ce qui suffit pour le parcours "tester sans créer de compte".
 */

const PROFILE_KEY = "acadmatch:profile";
const SELECTED_FORMATION_KEY = "acadmatch:selectedFormationId";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function saveProfile(profile: StudentProfile): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): StudentProfile | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PROFILE_KEY);
}

export function saveSelectedFormationId(formationId: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(SELECTED_FORMATION_KEY, formationId);
}

export function loadSelectedFormationId(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(SELECTED_FORMATION_KEY);
}
