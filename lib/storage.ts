import type { StudentProfile } from "@/types";

/**
 * Persistance locale (aucun compte, aucune base de données pour ce prototype).
 * Le profil et la formation sélectionnée voyagent d'une page à l'autre via
 * localStorage, ce qui suffit pour le parcours "tester sans créer de compte".
 *
 * Certains navigateurs (navigation privée stricte, postes verrouillés
 * d'établissement, extensions de confidentialité) refusent l'accès à
 * localStorage — parfois dès la simple lecture de `window.localStorage`, qui
 * peut alors lever une exception. Chaque fonction ci-dessous est donc
 * défensive : en cas d'échec, elle se dégrade silencieusement (profil non
 * trouvé / non sauvegardé) plutôt que de laisser une erreur remonter et
 * faire planter la page qui l'appelle.
 */

const PROFILE_KEY = "acadmatch:profile";
const SELECTED_FORMATION_KEY = "acadmatch:selectedFormationId";

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveProfile(profile: StudentProfile): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Stockage plein, désactivé ou bloqué : on continue sans persister.
  }
}

export function loadProfile(): StudentProfile | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(PROFILE_KEY);
    if (!raw) return null;
    // Migration douce : un profil enregistré avant l'ajout de `languages`
    // (voir types/index.ts) n'a pas ce champ — on le complète plutôt que de
    // laisser le moteur de matching recevoir `languages: undefined`. Un
    // tableau vide est traité comme absent : sans langue déclarée, le
    // prérequis implicite de langue échouerait pour toute formation
    // (voir computeLanguageStrength dans lib/matching/engine.ts).
    const profile = JSON.parse(raw) as Omit<StudentProfile, "languages"> & { languages?: string[] };
    return { ...profile, languages: profile.languages?.length ? profile.languages : ["Français"] };
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(PROFILE_KEY);
  } catch {
    // Rien à faire de plus si la suppression échoue.
  }
}

export function saveSelectedFormationId(formationId: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(SELECTED_FORMATION_KEY, formationId);
  } catch {
    // Non bloquant : la formation sélectionnée reste dans l'URL de toute façon.
  }
}

export function loadSelectedFormationId(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(SELECTED_FORMATION_KEY);
  } catch {
    return null;
  }
}
