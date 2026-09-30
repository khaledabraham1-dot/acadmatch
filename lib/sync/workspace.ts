import { readSyncMeta, SYNCED_KEYS, writeSyncMeta, type SyncedKey } from "@/lib/storage";

/**
 * Synchronisation de l'espace étudiant avec le compte (2026-09-30) —
 * logique pure, testable sans navigateur ni réseau.
 *
 * Unité de synchronisation : une clé de SYNCED_KEYS (profil, candidatures,
 * budgets, visa, sauvegardes), stockée telle quelle (JSON brut) avec sa date
 * de dernière modification. Règle : pour chaque clé, la version la plus
 * récente gagne. Simple et prévisible pour l'usage réel (le même étudiant
 * passe d'un appareil à l'autre, rarement en même temps).
 *
 * Ordinateur partagé : si les données de l'appareil appartiennent à un AUTRE
 * compte, elles sont remplacées par celles du compte connecté, jamais
 * fusionnées (on ne mélange pas les projets de deux personnes).
 */

export interface WorkspaceEntry {
  /** JSON brut tel qu'écrit dans localStorage ; null = donnée effacée. */
  value: string | null;
  updatedAt: string;
}

export interface Workspace {
  version: 1;
  entries: Partial<Record<SyncedKey, WorkspaceEntry>>;
}

/** Plafond aligné sur la contrainte de la table (supabase/migrations/0004_workspaces.sql). */
export const MAX_WORKSPACE_BYTES = 512 * 1024;
/** Date attribuée aux données locales antérieures à la synchronisation (jamais datées). */
const UNDATED = "1970-01-01T00:00:00.000Z";

export const emptyWorkspace = (): Workspace => ({ version: 1, entries: {} });

/** Photographie des données synchronisées de cet appareil. */
export function snapshotLocal(storage: Storage): Workspace {
  const meta = readSyncMeta(storage);
  const entries: Workspace["entries"] = {};
  for (const key of SYNCED_KEYS) {
    let value: string | null = null;
    try {
      value = storage.getItem(key);
    } catch {
      value = null;
    }
    const updatedAt = meta.updatedAt[key];
    if (value !== null) entries[key] = { value, updatedAt: updatedAt ?? UNDATED };
    else if (updatedAt) entries[key] = { value: null, updatedAt };
  }
  return { version: 1, entries };
}

/** Valide une ligne lue en base (jamais digne de confiance). */
export function parseRemoteWorkspace(raw: unknown): Workspace | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as { version?: unknown; entries?: unknown };
  if (data.version !== 1 || !data.entries || typeof data.entries !== "object") return null;
  const entries: Workspace["entries"] = {};
  for (const key of SYNCED_KEYS) {
    const entry = (data.entries as Record<string, unknown>)[key] as Partial<WorkspaceEntry> | undefined;
    if (!entry || typeof entry.updatedAt !== "string") continue;
    if (entry.value !== null && typeof entry.value !== "string") continue;
    entries[key] = { value: entry.value ?? null, updatedAt: entry.updatedAt };
  }
  return { version: 1, entries };
}

export interface SyncPlan {
  merged: Workspace;
  /** Clés à réécrire sur cet appareil (valeur du compte plus récente, ou remplacement). */
  applyLocally: SyncedKey[];
  /** Le compte doit recevoir la version fusionnée. */
  needsPush: boolean;
  /** Les données de l'appareil appartenaient à un autre compte et ont été remplacées. */
  replacedOtherOwner: boolean;
}

export function planSync(
  local: Workspace,
  remote: Workspace | null,
  localOwner: string | null,
  userId: string,
): SyncPlan {
  if (localOwner && localOwner !== userId) {
    const merged = remote ?? emptyWorkspace();
    const applyLocally = SYNCED_KEYS.filter((key) => (local.entries[key]?.value ?? null) !== (merged.entries[key]?.value ?? null));
    return { merged, applyLocally, needsPush: false, replacedOtherOwner: true };
  }

  const merged = emptyWorkspace();
  const applyLocally: SyncedKey[] = [];
  let needsPush = remote === null;
  for (const key of SYNCED_KEYS) {
    const l = local.entries[key];
    const r = remote?.entries[key];
    if (!l && !r) continue;
    const winner = !r || (l && l.updatedAt > r.updatedAt) ? l! : r;
    merged.entries[key] = winner;
    if (winner === r && (l?.value ?? null) !== r.value) applyLocally.push(key);
    if (winner === l && (r?.value ?? null) !== l.value) needsPush = true;
  }
  return { merged, applyLocally, needsPush, replacedOtherOwner: false };
}

/** Écrit sur l'appareil les clés venues du compte, sans les redater (ce ne sont pas des modifications locales). */
export function applyToLocal(storage: Storage, merged: Workspace, keys: SyncedKey[], userId: string): void {
  const meta = readSyncMeta(storage);
  const updatedAt = { ...meta.updatedAt };
  for (const key of keys) {
    const entry = merged.entries[key];
    try {
      if (!entry || entry.value === null) storage.removeItem(key);
      else storage.setItem(key, entry.value);
    } catch {
      // Stockage plein ou bloqué : la clé sera retentée à la prochaine synchronisation.
    }
    if (entry) updatedAt[key] = entry.updatedAt;
    else delete updatedAt[key];
  }
  writeSyncMeta({ owner: userId, updatedAt }, storage);
}

export function workspaceSize(workspace: Workspace): number {
  return new TextEncoder().encode(JSON.stringify(workspace)).length;
}

/** Efface de cet appareil toutes les données du projet (ordinateur partagé). */
export function clearLocalWorkspace(storage: Storage): void {
  for (const key of SYNCED_KEYS) {
    try {
      storage.removeItem(key);
    } catch {
      // Non bloquant.
    }
  }
  writeSyncMeta({ owner: null, updatedAt: {} }, storage);
}
