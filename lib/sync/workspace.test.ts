import { describe, expect, it } from "vitest";
import { readSyncMeta, SYNC_META_KEY } from "@/lib/storage";
import {
  applyToLocal,
  clearLocalWorkspace,
  parseRemoteWorkspace,
  planSync,
  snapshotLocal,
  workspaceSize,
  type Workspace,
} from "./workspace";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

const PROFILE = "acadmatch:profile";
const APPS = "acadmatch:applications";
const at = (minutes: number) => new Date(Date.UTC(2026, 8, 30, 10, minutes)).toISOString();
const ws = (entries: Workspace["entries"]): Workspace => ({ version: 1, entries });

function deviceWith(values: Record<string, string>, updatedAt: Record<string, string>, owner: string | null = null) {
  const storage = new MemoryStorage();
  for (const [k, v] of Object.entries(values)) storage.setItem(k, v);
  storage.setItem(SYNC_META_KEY, JSON.stringify({ owner, updatedAt }));
  return storage;
}

describe("synchronisation de l'espace étudiant", () => {
  it("nouvel appareil : tout vient du compte", () => {
    const local = snapshotLocal(new MemoryStorage());
    const remote = ws({ [PROFILE]: { value: '{"a":1}', updatedAt: at(1) }, [APPS]: { value: "[]", updatedAt: at(2) } });
    const plan = planSync(local, remote, null, "u1");
    expect(plan.applyLocally.sort()).toEqual([APPS, PROFILE].sort());
    expect(plan.needsPush).toBe(false);
  });

  it("premier envoi : un compte vide reçoit les données de l'appareil", () => {
    const device = deviceWith({ [PROFILE]: '{"a":1}' }, { [PROFILE]: at(5) });
    const plan = planSync(snapshotLocal(device), null, null, "u1");
    expect(plan.needsPush).toBe(true);
    expect(plan.merged.entries[PROFILE]?.value).toBe('{"a":1}');
  });

  it("clé par clé, la version la plus récente gagne", () => {
    const device = deviceWith({ [PROFILE]: '{"local":true}', [APPS]: '["vieux"]' }, { [PROFILE]: at(20), [APPS]: at(1) }, "u1");
    const remote = ws({ [PROFILE]: { value: '{"remote":true}', updatedAt: at(10) }, [APPS]: { value: '["récent"]', updatedAt: at(15) } });
    const plan = planSync(snapshotLocal(device), remote, "u1", "u1");
    expect(plan.merged.entries[PROFILE]?.value).toBe('{"local":true}');
    expect(plan.merged.entries[APPS]?.value).toBe('["récent"]');
    expect(plan.applyLocally).toEqual([APPS]);
    expect(plan.needsPush).toBe(true);
  });

  it("une suppression récente se propage", () => {
    const device = deviceWith({}, { [APPS]: at(30) }, "u1");
    const remote = ws({ [APPS]: { value: '["ancienne"]', updatedAt: at(10) } });
    const plan = planSync(snapshotLocal(device), remote, "u1", "u1");
    expect(plan.merged.entries[APPS]?.value).toBeNull();
    expect(plan.needsPush).toBe(true);
  });

  it("ordinateur partagé : les données d'un autre compte sont remplacées, jamais fusionnées", () => {
    const device = deviceWith({ [PROFILE]: '{"autre":true}', [APPS]: '["autre"]' }, { [PROFILE]: at(50), [APPS]: at(50) }, "u2");
    const remote = ws({ [PROFILE]: { value: '{"moi":true}', updatedAt: at(1) } });
    const plan = planSync(snapshotLocal(device), remote, "u2", "u1");
    expect(plan.replacedOtherOwner).toBe(true);
    expect(plan.needsPush).toBe(false);
    applyToLocal(device, plan.merged, plan.applyLocally, "u1");
    expect(device.getItem(PROFILE)).toBe('{"moi":true}');
    expect(device.getItem(APPS)).toBeNull();
    expect(readSyncMeta(device).owner).toBe("u1");
  });

  it("appliquer sur l'appareil garde les dates du compte (pas de faux « modifié localement »)", () => {
    const device = new MemoryStorage();
    const remote = ws({ [PROFILE]: { value: '{"a":1}', updatedAt: at(7) } });
    applyToLocal(device, remote, [PROFILE], "u1");
    expect(readSyncMeta(device).updatedAt[PROFILE]).toBe(at(7));
    expect(planSync(snapshotLocal(device), remote, "u1", "u1").needsPush).toBe(false);
  });

  it("rejette une ligne en base mal formée", () => {
    expect(parseRemoteWorkspace(null)).toBeNull();
    expect(parseRemoteWorkspace({ version: 2, entries: {} })).toBeNull();
    const parsed = parseRemoteWorkspace({ version: 1, entries: { [PROFILE]: { value: 42, updatedAt: at(1) }, inconnu: {} } });
    expect(parsed?.entries).toEqual({});
  });

  it("efface l'appareil à la déconnexion si demandé", () => {
    const device = deviceWith({ [PROFILE]: "{}" }, { [PROFILE]: at(1) }, "u1");
    clearLocalWorkspace(device);
    expect(device.getItem(PROFILE)).toBeNull();
    expect(readSyncMeta(device)).toEqual({ owner: null, updatedAt: {} });
  });

  it("mesure la taille envoyée", () => {
    expect(workspaceSize(ws({ [PROFILE]: { value: "x".repeat(1000), updatedAt: at(1) } }))).toBeGreaterThan(1000);
  });
});
