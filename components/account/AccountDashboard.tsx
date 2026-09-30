"use client";

import { useId, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Download, LogOut, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SYNCED_KEYS } from "@/lib/storage";
import { signOut, syncNow } from "@/lib/sync/client";
import { clearLocalWorkspace, snapshotLocal } from "@/lib/sync/workspace";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SyncPanel } from "@/components/account/SyncStatus";

type ActionStatus = { kind: "idle" | "success" | "error"; message?: string };

const IDLE: ActionStatus = { kind: "idle" };

/** Toutes les données du projet, lisibles (JSON décodé), pour l'export RGPD. */
function exportPayload() {
  const workspace = snapshotLocal(window.localStorage);
  const data: Record<string, unknown> = {};
  for (const key of SYNCED_KEYS) {
    const entry = workspace.entries[key];
    if (!entry?.value) continue;
    try {
      data[key.replace("acadmatch:", "")] = { valeur: JSON.parse(entry.value), modifieLe: entry.updatedAt };
    } catch {
      data[key.replace("acadmatch:", "")] = { valeur: entry.value, modifieLe: entry.updatedAt };
    }
  }
  return { exporteLe: new Date().toISOString(), donnees: data };
}

export function AccountDashboard({ user }: { user: User }) {
  const [status, setStatus] = useState<ActionStatus>(IDLE);
  const [busy, setBusy] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [clearDevice, setClearDevice] = useState(false);
  const clearId = useId();

  async function handleExport() {
    setBusy(true);
    await syncNow();
    setBusy(false);
    const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "acadmatch-mes-donnees.json";
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ kind: "success", message: "Export téléchargé : profil, candidatures, budgets, visa et formations sauvegardées." });
  }

  async function handleLogout() {
    setBusy(true);
    await signOut(clearDevice);
    window.location.reload();
  }

  async function handleDeleteAccount() {
    setBusy(true);
    const response = await fetch("/api/account/delete", { method: "POST" });
    setBusy(false);
    if (!response.ok) {
      setStatus({ kind: "error", message: "Échec de la suppression. Réessayez ou contactez le support." });
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    clearLocalWorkspace(window.localStorage);
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-base font-semibold text-slate-900">Mon compte</h2>
        <p className="mt-1 text-sm text-slate-500">Connecté en tant que {user.email}.</p>

        <div className="mt-4">
          <SyncPanel />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={busy}>
            <Download className="size-4" aria-hidden />
            Exporter toutes mes données (JSON)
          </Button>
        </div>

        {status.kind !== "idle" && (
          <p className={"mt-3 text-sm " + (status.kind === "error" ? "text-red-600" : "text-emerald-700")}>{status.message}</p>
        )}

        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
          <label htmlFor={clearId} className="flex items-start gap-2 text-sm text-slate-700">
            <input id={clearId} type="checkbox" className="mt-1" checked={clearDevice} onChange={(e) => setClearDevice(e.target.checked)} />
            <span>
              Effacer aussi mon projet de cet appareil
              <span className="block text-xs text-slate-500">
                Recommandé sur un ordinateur partagé (cybercafé, bibliothèque). Vos données restent sur votre compte.
              </span>
            </span>
          </label>
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={busy}>
            <LogOut className="size-4" aria-hidden />
            Se déconnecter
          </Button>
        </div>
      </Card>

      <Card className="border-red-100 bg-red-50/40">
        <h3 className="text-sm font-semibold text-slate-900">Zone dangereuse</h3>
        <p className="mt-1 text-xs text-slate-600">
          Supprime définitivement votre compte et tout le projet sauvegardé (profil, candidatures, lettres,
          budgets, visa), sur votre compte et sur cet appareil.
        </p>
        {deleteConfirming ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleDeleteAccount} disabled={busy}>
              <Trash2 className="size-4" aria-hidden />
              Confirmer la suppression définitive
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirming(false)} disabled={busy}>
              Annuler
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="mt-3 border-red-200 text-red-700 hover:bg-red-50" onClick={() => setDeleteConfirming(true)}>
            <Trash2 className="size-4" aria-hidden />
            Supprimer mon compte
          </Button>
        )}
      </Card>
    </div>
  );
}
