import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin/session";
import { isPeriod } from "@/lib/admin/dashboard";
import { loadDashboard } from "@/lib/admin/loadDashboard";

/**
 * Données en direct du tableau de bord (2026-10-07), relues toutes les 30
 * secondes par la page admin. Servie à l'adresse secrète + /donnees ; toute
 * requête qui n'est pas celle d'un admin pleinement vérifié reçoit 404.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await checkAdmin();
  if (access.status !== "admin") return new NextResponse("Introuvable", { status: 404 });
  const raw = new URL(request.url).searchParams.get("jours");
  const period = isPeriod(raw) ? (Number(raw) as 7 | 30 | 90) : 30;
  return NextResponse.json(await loadDashboard(period), { headers: { "Cache-Control": "no-store" } });
}
