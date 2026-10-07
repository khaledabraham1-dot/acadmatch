import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { loadDigest } from "@/lib/admin/loadAlerts";
import { logAdminAction } from "@/lib/admin/session";
import { sendEmail } from "@/lib/email/resend";

/**
 * Résumé quotidien des alertes admin (2026-10-08), lancé chaque matin par
 * Vercel Cron (vercel.json). Vercel envoie « Authorization: Bearer
 * <CRON_SECRET> » : sans ce secret exact, la route refuse tout. Un e-mail
 * n'est envoyé que s'il y a quelque chose d'important (lib/admin/alerts.ts).
 */
export const dynamic = "force-dynamic";

function authorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
  if (!authorized(request.headers.get("authorization"))) return new NextResponse("Introuvable", { status: 404 });
  if (!process.env.SUPABASE_SECRET_KEY) return NextResponse.json({ sent: false, reason: "Supabase non configuré" });

  const { digest, error } = await loadDigest();
  if (error) return NextResponse.json({ sent: false, reason: error }, { status: 503 });
  if (!digest) return NextResponse.json({ sent: false, reason: "Rien d'important aujourd'hui" });

  const result = await sendEmail(digest);
  if (!result.ok) return NextResponse.json({ sent: false, reason: result.reason }, { status: 502 });
  await logAdminAction("tâche automatique", "alerte-envoyee", digest.reasons.join(", "));
  return NextResponse.json({ sent: true, reasons: digest.reasons });
}
