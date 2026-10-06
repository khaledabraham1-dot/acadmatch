import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdmin, logAdminAction } from "@/lib/admin/session";
import { toCsv } from "@/lib/admin/csv";

/**
 * Export CSV des données anonymes de l'admin (2026-10-06) :
 * /admin/export?type=demandes|avis|parcours. Réservé à un administrateur
 * récemment connecté ; toute autre requête reçoit 404.
 */
const EXPORTS = {
  demandes: {
    table: "formation_requests",
    columns: "created_at, wanted, institution, country, source, search_query, profile_field, profile_level, profile_goal, status",
    head: ["Date", "Formation demandée", "Établissement ou ville", "Pays", "Origine", "Recherche", "Domaine", "Niveau", "Diplôme visé", "Statut"],
  },
  avis: {
    table: "feedback",
    columns: "created_at, formation_id, score, helpfulness, score_fairness, comment, profile_field, profile_level, score_estimate, from_transcript",
    head: ["Date", "Formation", "Score", "Utile", "Justesse du score", "Commentaire", "Domaine", "Niveau", "Score estimé", "Depuis un relevé"],
  },
  parcours: {
    table: "journey_events",
    columns: "created_at, step, detail, device",
    head: ["Date", "Étape", "Détail", "Appareil"],
  },
} as const;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await checkAdmin();
  if (access.status !== "admin") return new NextResponse("Introuvable", { status: 404 });
  const type = new URL(request.url).searchParams.get("type");
  if (type !== "demandes" && type !== "avis" && type !== "parcours") return new NextResponse("Type d'export inconnu", { status: 400 });

  const spec = EXPORTS[type];
  const { data, error } = await createAdminClient().from(spec.table).select(spec.columns).order("created_at", { ascending: false }).limit(20000);
  if (error) return new NextResponse("Lecture impossible", { status: 503 });

  const keys = spec.columns.split(",").map((c) => c.trim());
  const rows = (data as unknown as Record<string, unknown>[]).map((row) => keys.map((k) => row[k]));
  await logAdminAction(access.email, "export", `${type} (${rows.length} lignes)`);
  return new NextResponse(toCsv([...spec.head], rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="acadmatch-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
