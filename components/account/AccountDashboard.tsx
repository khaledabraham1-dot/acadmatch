"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Download, LogOut, Trash2, UploadCloud, DownloadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadProfile, saveProfile } from "@/lib/storage";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type ActionStatus = { kind: "idle" | "success" | "error"; message?: string };

const IDLE: ActionStatus = { kind: "idle" };

export function AccountDashboard({ user }: { user: User }) {
  const [status, setStatus] = useState<ActionStatus>(IDLE);
  const [busy, setBusy] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  async function handleSaveToAccount() {
    const profile = loadProfile();
    if (!profile) {
      setStatus({ kind: "error", message: "Aucun profil local à sauvegarder — renseignez d'abord votre profil." });
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, data: profile, updated_at: new Date().toISOString() });
    setBusy(false);
    setStatus(
      error
        ? { kind: "error", message: "Échec de la sauvegarde. Réessayez." }
        : { kind: "success", message: "Profil sauvegardé sur votre compte." },
    );
  }

  async function handleLoadFromAccount() {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("profiles").select("data").eq("id", user.id).maybeSingle();
    setBusy(false);
    if (error || !data) {
      setStatus({ kind: "error", message: "Aucun profil trouvé sur votre compte." });
      return;
    }
    saveProfile(data.data);
    setStatus({ kind: "success", message: "Profil de votre compte chargé sur cet appareil." });
  }

  async function handleExport() {
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("data, updated_at").eq("id", user.id).maybeSingle();
    setBusy(false);
    const payload = data ?? { data: loadProfile(), updated_at: null, note: "Profil local, jamais sauvegardé sur le compte." };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "acadmatch-profil.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
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
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-base font-semibold text-slate-900">Mon compte</h2>
        <p className="mt-1 text-sm text-slate-500">Connecté en tant que {user.email}.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveToAccount} disabled={busy}>
            <UploadCloud className="size-4" aria-hidden />
            Sauvegarder mon profil sur mon compte
          </Button>
          <Button variant="outline" size="sm" onClick={handleLoadFromAccount} disabled={busy}>
            <DownloadCloud className="size-4" aria-hidden />
            Charger le profil de mon compte
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={busy}>
            <Download className="size-4" aria-hidden />
            Exporter mes données (JSON)
          </Button>
        </div>

        {status.kind !== "idle" && (
          <p className={"mt-3 text-sm " + (status.kind === "error" ? "text-red-600" : "text-emerald-600")}>
            {status.message}
          </p>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" aria-hidden />
            Se déconnecter
          </Button>
        </div>
      </Card>

      <Card className="border-red-100 bg-red-50/40">
        <h3 className="text-sm font-semibold text-slate-900">Zone dangereuse</h3>
        <p className="mt-1 text-xs text-slate-500">
          Supprime définitivement votre compte et le profil sauvegardé associé. Votre profil local
          sur cet appareil (localStorage) n&apos;est pas affecté.
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
