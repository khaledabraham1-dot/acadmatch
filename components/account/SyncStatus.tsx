"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CloudOff, Loader2, Smartphone } from "lucide-react";
import { getServerSyncStatus, getSyncStatus, startSync, subscribeSync, syncNow, type SyncState } from "@/lib/sync/client";
import { cn } from "@/lib/utils";

/** Démarre la synchronisation sur chaque page (monté une fois dans le layout racine). */
export function SyncManager() {
  useEffect(() => {
    void startSync();
  }, []);
  return null;
}

export function useSyncStatus() {
  return useSyncExternalStore(subscribeSync, getSyncStatus, getServerSyncStatus);
}

const LABELS: Record<SyncState, string> = {
  local: "Enregistré sur cet appareil uniquement",
  syncing: "Enregistrement sur votre compte…",
  synced: "Sauvegardé sur votre compte",
  offline: "Hors ligne : sera enregistré au retour du réseau",
  error: "Sauvegarde sur le compte impossible pour le moment",
  "too-large": "Espace trop volumineux pour être sauvegardé",
};

function Icon({ state }: { state: SyncState }) {
  const className = "size-3.5 shrink-0";
  if (state === "synced") return <CheckCircle2 className={cn(className, "text-blue-600")} aria-hidden />;
  if (state === "syncing") return <Loader2 className={cn(className, "animate-spin")} aria-hidden />;
  if (state === "offline") return <CloudOff className={className} aria-hidden />;
  if (state === "local") return <Smartphone className={className} aria-hidden />;
  return <AlertTriangle className={cn(className, "text-amber-600")} aria-hidden />;
}

/** Indicateur discret (barre latérale, menu mobile). */
export function SyncBadge({ dark = false }: { dark?: boolean }) {
  const { state } = useSyncStatus();
  return (
    <p role="status" className={cn("flex items-center gap-1.5 text-xs", dark ? "text-slate-300" : "text-slate-600")}>
      <Icon state={state} />
      <span>
        {LABELS[state]}
        {state === "local" && (
          <>
            {" · "}
            <Link href="/compte" className={cn("font-bold underline underline-offset-2", dark ? "text-slate-200" : "text-slate-900")}>
              Créer un compte
            </Link>
          </>
        )}
      </span>
    </p>
  );
}

/** Détail sur la page Mon compte, avec synchronisation manuelle. */
export function SyncPanel() {
  const { state, lastSyncedAt, replacedOtherOwner } = useSyncStatus();
  return (
    <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <p className="flex items-center gap-2 font-bold text-slate-900">
        <Icon state={state} />
        {LABELS[state]}
      </p>
      <p className="mt-1 text-slate-600">
        Profil, candidatures, lettres, préparations d&apos;entretien, budgets, réponses visa et formations
        sauvegardées se synchronisent automatiquement sur tous vos appareils.
        {lastSyncedAt && ` Dernière synchronisation : ${new Date(lastSyncedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`}
      </p>
      {replacedOtherOwner && (
        <p className="mt-1 text-amber-800">
          Cet appareil contenait le projet d&apos;un autre compte : il a été remplacé par le vôtre, sans mélange.
        </p>
      )}
      {(state === "error" || state === "offline" || state === "synced") && (
        <button type="button" onClick={() => void syncNow()} className="mt-2 font-bold text-blue-700 underline underline-offset-2">
          Synchroniser maintenant
        </button>
      )}
    </div>
  );
}
