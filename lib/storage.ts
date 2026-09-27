import type { Application, BudgetPlan, InterviewPrep, InterviewQuestionCategory, StudentProfile } from "@/types";
import { INTERVIEW_QUESTION_CATEGORIES } from "@/types";

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
/** Shortlist pour la comparaison côte-à-côte (Étape 7) — max 3 formations. */
const COMPARE_IDS_KEY = "acadmatch:compareIds";
export const MAX_COMPARE_FORMATIONS = 3;
/**
 * Formations sauvegardées (Phase 12) — liste distincte de la shortlist de
 * comparaison : un étudiant explore souvent plus de 3 formations qui
 * l'intéressent avant de restreindre son choix, et "sauvegarder pour plus
 * tard" n'a pas le même cycle de vie que "comparer maintenant" (la
 * comparaison se vide facilement, une sauvegarde doit rester). Plafond large
 * (garde-fou anti-abus, pas une contrainte UX comme pour la comparaison).
 */
const SAVED_FORMATION_IDS_KEY = "acadmatch:savedFormationIds";
export const MAX_SAVED_FORMATIONS = 30;
/** Suivi des candidatures (Phase 13) — une candidature par formation (`formationId` fait clé). */
const APPLICATIONS_KEY = "acadmatch:applications";

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

export function loadCompareIds(): string[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(COMPARE_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string").slice(0, MAX_COMPARE_FORMATIONS);
  } catch {
    return [];
  }
}

function saveCompareIds(ids: string[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(COMPARE_IDS_KEY, JSON.stringify(ids.slice(0, MAX_COMPARE_FORMATIONS)));
  } catch {
    // Non bloquant.
  }
}

/** Ajoute ou retire une formation de la shortlist de comparaison. */
export function toggleCompareId(formationId: string): string[] {
  const current = loadCompareIds();
  if (current.includes(formationId)) {
    const next = current.filter((id) => id !== formationId);
    saveCompareIds(next);
    return next;
  }
  if (current.length >= MAX_COMPARE_FORMATIONS) return current;
  const next = [...current, formationId];
  saveCompareIds(next);
  return next;
}

export function clearCompareIds(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(COMPARE_IDS_KEY);
  } catch {
    // Non bloquant.
  }
}

export function loadSavedFormationIds(): string[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(SAVED_FORMATION_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string").slice(0, MAX_SAVED_FORMATIONS);
  } catch {
    return [];
  }
}

function saveSavedFormationIds(ids: string[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(SAVED_FORMATION_IDS_KEY, JSON.stringify(ids.slice(0, MAX_SAVED_FORMATIONS)));
  } catch {
    // Non bloquant.
  }
}

/** Ajoute ou retire une formation de la liste des sauvegardes. */
export function toggleSavedFormationId(formationId: string): string[] {
  const current = loadSavedFormationIds();
  if (current.includes(formationId)) {
    const next = current.filter((id) => id !== formationId);
    saveSavedFormationIds(next);
    return next;
  }
  if (current.length >= MAX_SAVED_FORMATIONS) return current;
  const next = [...current, formationId];
  saveSavedFormationIds(next);
  return next;
}

function isValidChecklistItem(value: unknown): value is Application["documents"][number] {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.label === "string" && typeof item.done === "boolean";
}

const VALID_APPLICATION_STATUSES = new Set<Application["status"]>([
  "à préparer",
  "prête",
  "envoyée",
  "en attente",
  "réponse reçue",
]);

function isValidApplication(value: unknown): value is Application {
  if (!value || typeof value !== "object") return false;
  const app = value as Record<string, unknown>;
  return (
    typeof app.formationId === "string" &&
    typeof app.status === "string" &&
    VALID_APPLICATION_STATUSES.has(app.status as Application["status"]) &&
    typeof app.notes === "string" &&
    Array.isArray(app.documents) &&
    app.documents.every(isValidChecklistItem) &&
    Array.isArray(app.nextActions) &&
    app.nextActions.every(isValidChecklistItem)
  );
}

function isValidInterviewPrep(value: unknown): value is InterviewPrep {
  if (!value || typeof value !== "object") return false;
  const prep = value as Record<string, unknown>;
  return (
    typeof prep.language === "string" &&
    typeof prep.generatedAt === "string" &&
    Array.isArray(prep.questions) &&
    prep.questions.every((q) => {
      if (!q || typeof q !== "object") return false;
      const question = q as Record<string, unknown>;
      return (
        typeof question.id === "string" &&
        typeof question.question === "string" &&
        typeof question.answer === "string" &&
        INTERVIEW_QUESTION_CATEGORIES.includes(question.category as InterviewQuestionCategory) &&
        (question.feedback === undefined || typeof question.feedback === "string")
      );
    })
  );
}

/**
 * Une préparation d'entretien illisible (Phase 18) est écartée seule,
 * sans perdre la candidature qui la porte — elle se régénère en un clic,
 * contrairement aux documents et notes de la candidature.
 */
function withValidInterviewPrep(application: Application): Application {
  if (application.interviewPrep === undefined || isValidInterviewPrep(application.interviewPrep)) {
    return application;
  }
  return { ...application, interviewPrep: undefined };
}

export function loadApplications(): Application[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(APPLICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidApplication).map(withValidInterviewPrep);
  } catch {
    return [];
  }
}

function saveApplications(applications: Application[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
  } catch {
    // Non bloquant.
  }
}

/** Crée ou met à jour (par `formationId`) une candidature suivie. */
export function upsertApplication(application: Application): Application[] {
  const current = loadApplications();
  const next = [
    ...current.filter((a) => a.formationId !== application.formationId),
    application,
  ];
  saveApplications(next);
  return next;
}

export function deleteApplication(formationId: string): Application[] {
  const next = loadApplications().filter((a) => a.formationId !== formationId);
  saveApplications(next);
  return next;
}

/** Construit l'URL de comparaison à partir d'une liste d'ids. */
export function compareResultsHref(ids: string[]): string {
  const unique = [...new Set(ids)].slice(0, MAX_COMPARE_FORMATIONS);
  if (unique.length === 0) return "/recherche";
  if (unique.length === 1) return `/resultat?formationId=${encodeURIComponent(unique[0])}`;
  return `/resultat?compare=${unique.map(encodeURIComponent).join(",")}`;
}

// ---------------------------------------------------------------------------
// Budgets prévisionnels (Phase 19) — un budget par formation, indépendant
// des candidatures : on chiffre souvent une formation avant de décider d'y
// candidater. Seules les hypothèses de l'étudiant sont stockées (voir
// `BudgetPlan`), jamais les coûts officiels, relus depuis data/budget.ts.
// ---------------------------------------------------------------------------

const BUDGETS_KEY = "acadmatch:budgets";

function isCentsRecord(value: unknown, keys: string[]): boolean {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return keys.every((k) => Number.isInteger(record[k]) && (record[k] as number) >= 0);
}

function isValidBudgetPlan(value: unknown): value is BudgetPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Record<string, unknown>;
  const currency = plan.displayCurrency as Record<string, unknown> | undefined;
  return (
    typeof plan.formationId === "string" &&
    (plan.feeProfile === "ue" || plan.feeProfile === "hors-ue") &&
    typeof plan.targetYear === "string" &&
    /^\d{4}-\d{4}$/.test(plan.targetYear) &&
    Number.isInteger(plan.months) &&
    isCentsRecord(plan.monthlyCosts, ["housing", "transport", "food", "other"]) &&
    isCentsRecord(plan.oneOffCosts, ["administrative", "settling", "other"]) &&
    isCentsRecord(plan.monthlyResources, ["scholarship", "family", "job", "other"]) &&
    isCentsRecord(plan.oneOffResources, ["savings", "other"]) &&
    (currency === undefined ||
      (typeof currency.code === "string" && typeof currency.rate === "number" && currency.rate > 0))
  );
}

export function loadBudgetPlan(formationId: string): BudgetPlan | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(BUDGETS_KEY) ?? "{}") as Record<string, unknown>;
    const plan = parsed?.[formationId];
    return isValidBudgetPlan(plan) && plan.formationId === formationId ? plan : null;
  } catch {
    return null;
  }
}

export function saveBudgetPlan(plan: BudgetPlan): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const current = JSON.parse(storage.getItem(BUDGETS_KEY) ?? "{}") as Record<string, unknown>;
    const next = current && typeof current === "object" && !Array.isArray(current) ? current : {};
    storage.setItem(BUDGETS_KEY, JSON.stringify({ ...next, [plan.formationId]: plan }));
  } catch {
    // Non bloquant.
  }
}
