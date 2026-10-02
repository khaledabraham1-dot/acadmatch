"use client";

import { readSyncMeta, STORAGE_CHANGED_EVENT } from "@/lib/storage";
import { hasSessionCookie, isSupabaseConfigured } from "@/lib/supabase/config";
import {
  applyToLocal,
  clearLocalWorkspace,
  MAX_WORKSPACE_BYTES,
  parseRemoteWorkspace,
  planSync,
  snapshotLocal,
  workspaceSize,
} from "@/lib/sync/workspace";

/**
 * Moteur de synchronisation côté navigateur (voir lib/sync/workspace.ts pour
 * la logique de fusion, testée à part).
 *
 * - Supabase n'est chargé QUE si un cookie de session existe : un visiteur
 *   sans compte ne télécharge pas la librairie (poids mobile).
 * - Chaque synchronisation relit le compte avant d'écrire (fusion clé par
 *   clé) : deux appareils ne s'écrasent pas à l'aveugle.
 * - Modifications regroupées (1,5 s), nouvelle synchronisation au retour sur
 *   l'onglet et au retour du réseau.
 */

export type SyncState = "local" | "syncing" | "synced" | "offline" | "error" | "too-large";

export interface SyncStatus {
  state: SyncState;
  lastSyncedAt: string | null;
  /** Les données de l'appareil appartenaient à un autre compte et ont été remplacées. */
  replacedOtherOwner: boolean;
}

const RELOADED_FLAG = "acadmatch-sync-reloaded";
const DEBOUNCE_MS = 1500;
const FOCUS_THROTTLE_MS = 60_000;

let status: SyncStatus = { state: "local", lastSyncedAt: null, replacedOtherOwner: false };
const listeners = new Set<() => void>();

function setStatus(next: Partial<SyncStatus>) {
  status = { ...status, ...next };
  listeners.forEach((listener) => listener());
}

export function subscribeSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSyncStatus = () => status;
const SERVER_STATUS: SyncStatus = { state: "local", lastSyncedAt: null, replacedOtherOwner: false };
export const getServerSyncStatus = () => SERVER_STATUS;

type SupabaseClient = ReturnType<typeof import("@/lib/supabase/client").createClient>;
let client: SupabaseClient | null = null;
let userId: string | null = null;
let started = false;
let running: Promise<void> | null = null;
let rerun = false;
let debounce: ReturnType<typeof setTimeout> | null = null;
let lastFocusSync = 0;

async function getClient(): Promise<SupabaseClient> {
  if (!client) {
    const { createClient } = await import("@/lib/supabase/client");
    client = createClient();
  }
  return client;
}

async function runSync(): Promise<void> {
  if (!userId || !client) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    setStatus({ state: "offline" });
    return;
  }
  setStatus({ state: "syncing" });
  const storage = window.localStorage;
  const { data, error } = await client.from("workspaces").select("data").eq("id", userId).maybeSingle();
  if (error) {
    setStatus({ state: "error" });
    return;
  }
  const remote = data ? parseRemoteWorkspace(data.data) : null;
  const meta = readSyncMeta(storage);
  const plan = planSync(snapshotLocal(storage), remote, meta.owner, userId);

  applyToLocal(storage, plan.merged, plan.applyLocally, userId);

  if (plan.needsPush) {
    if (workspaceSize(plan.merged) > MAX_WORKSPACE_BYTES) {
      setStatus({ state: "too-large" });
      return;
    }
    const { error: pushError } = await client
      .from("workspaces")
      .upsert({ id: userId, data: plan.merged, updated_at: new Date().toISOString() });
    if (pushError) {
      setStatus({ state: "error" });
      return;
    }
  }

  setStatus({ state: "synced", lastSyncedAt: new Date().toISOString(), replacedOtherOwner: plan.replacedOtherOwner });

  // Des données sont arrivées du compte alors que la page est déjà affichée :
  // un rechargement unique par session montre le projet à jour partout.
  if (plan.applyLocally.length > 0) {
    try {
      if (!sessionStorage.getItem(RELOADED_FLAG)) {
        sessionStorage.setItem(RELOADED_FLAG, "1");
        window.location.reload();
      }
    } catch {
      // sessionStorage bloqué : pas de rechargement, les pages se mettront à jour à la prochaine navigation.
    }
  }
}

/** Lance une synchronisation (une seule à la fois ; une demande pendant l'exécution relance à la fin). */
export function syncNow(): Promise<void> {
  if (running) {
    rerun = true;
    return running;
  }
  running = runSync()
    .catch(() => setStatus({ state: "error" }))
    .finally(() => {
      running = null;
      if (rerun) {
        rerun = false;
        void syncNow();
      }
    });
  return running;
}

/** Démarre la synchronisation (une fois par chargement de page). */
export async function startSync(): Promise<void> {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!isSupabaseConfigured() || !hasSessionCookie()) return;

  const supabase = await getClient();
  const { data } = await supabase.auth.getUser();
  userId = data.user?.id ?? null;
  if (!userId) return;

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      userId = null;
      setStatus({ state: "local", lastSyncedAt: null });
    } else if (session?.user && session.user.id !== userId) {
      userId = session.user.id;
      void syncNow();
    }
  });

  window.addEventListener(STORAGE_CHANGED_EVENT, () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => void syncNow(), DEBOUNCE_MS);
  });
  window.addEventListener("online", () => void syncNow());
  window.addEventListener("offline", () => setStatus({ state: "offline" }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || Date.now() - lastFocusSync < FOCUS_THROTTLE_MS) return;
    lastFocusSync = Date.now();
    void syncNow();
  });

  await syncNow();
}

/**
 * Déconnexion. `clearDevice` : efface aussi le projet de cet appareil
 * (ordinateur partagé, cybercafé). Sinon les données restent, rattachées au
 * compte : un autre compte qui se connecterait ici ne les récupérerait pas.
 */
export async function signOut(clearDevice: boolean): Promise<void> {
  if (debounce) clearTimeout(debounce);
  if (userId && !clearDevice) await syncNow();
  const supabase = await getClient();
  await supabase.auth.signOut();
  // Sans effacement, les données restent rattachées à ce compte (owner) : un
  // autre compte connecté ensuite ne les récupère pas (voir planSync).
  if (clearDevice) clearLocalWorkspace(window.localStorage);
  try {
    sessionStorage.removeItem(RELOADED_FLAG);
  } catch {
    // Non bloquant.
  }
}
