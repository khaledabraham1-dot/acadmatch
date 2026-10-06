"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction, requireAdmin } from "@/lib/admin/session";
import type { RequestStatus } from "@/lib/admin/stats";

/**
 * Actions de l'espace admin (2026-10-06). Une action serveur est appelable
 * par une requête POST directe : chacune revérifie l'administrateur et sa
 * connexion récente (requireAdmin) avant toute écriture, puis la trace dans
 * le journal admin_audit.
 */

const STATUSES: RequestStatus[] = ["a-traiter", "ajoutee", "refusee"];
const STATUS_LABELS: Record<RequestStatus, string> = { "a-traiter": "à traiter", ajoutee: "ajoutée au catalogue", refusee: "refusée" };

export async function setRequestStatus(formData: FormData): Promise<void> {
  const email = await requireAdmin();
  const status = formData.get("status");
  let wanted: unknown;
  try {
    wanted = JSON.parse(String(formData.get("wanted") ?? "[]"));
  } catch {
    return;
  }
  if (!STATUSES.includes(status as RequestStatus)) return;
  if (!Array.isArray(wanted) || wanted.length === 0 || wanted.length > 200 || !wanted.every((w) => typeof w === "string" && w.length <= 200)) return;

  const { error } = await createAdminClient()
    .from("formation_requests")
    .update({ status, handled_at: status === "a-traiter" ? null : new Date().toISOString() })
    .in("wanted", wanted);
  if (!error) await logAdminAction(email, "statut-demande", `« ${wanted[0]} » : ${STATUS_LABELS[status as RequestStatus]}`);
  revalidatePath("/admin");
}

export interface DeletionState {
  ok: boolean;
  message: string;
}

/**
 * Suppression d'un compte à la demande d'un étudiant (droit à l'effacement).
 * Supprime le compte et, en cascade, son profil et son projet synchronisé.
 * L'adresse doit être saisie deux fois ; l'administrateur ne peut pas
 * supprimer son propre compte d'ici.
 */
export async function deleteAccountByEmail(_previous: DeletionState, formData: FormData): Promise<DeletionState> {
  let adminEmail: string;
  try {
    adminEmail = await requireAdmin();
  } catch {
    return { ok: false, message: "Accès refusé : reconnectez-vous à l'espace admin." };
  }
  const target = String(formData.get("email") ?? "").trim().toLowerCase();
  const confirmation = String(formData.get("confirmation") ?? "").trim().toLowerCase();
  if (!target.includes("@") || target.length > 320) return { ok: false, message: "Adresse e-mail invalide." };
  if (target !== confirmation) return { ok: false, message: "Les deux adresses ne correspondent pas." };
  if (target === adminEmail.toLowerCase()) return { ok: false, message: "Vous ne pouvez pas supprimer votre propre compte depuis l'admin." };

  const db = createAdminClient();
  let userId: string | null = null;
  for (let page = 1; page <= 50 && !userId; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return { ok: false, message: "Lecture des comptes impossible. Réessayez plus tard." };
    userId = data.users.find((u) => u.email?.toLowerCase() === target)?.id ?? null;
    if (data.users.length < 1000) break;
  }
  if (!userId) return { ok: false, message: "Aucun compte n'utilise cette adresse." };

  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { ok: false, message: "La suppression a échoué. Réessayez plus tard." };
  // Le journal ne garde pas l'adresse supprimée : seulement son domaine, pour ne pas conserver la donnée effacée.
  await logAdminAction(adminEmail, "suppression-compte", `Compte supprimé (domaine ${target.split("@")[1]})`);
  revalidatePath("/admin");
  return { ok: true, message: "Compte supprimé, avec son profil et son projet synchronisé." };
}
