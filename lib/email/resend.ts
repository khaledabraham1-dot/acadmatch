import "server-only";
import { parseAdminEmails } from "@/lib/admin/access";

/**
 * Envoi d'e-mails via l'API de Resend (2026-10-08), sans dépendance : un
 * simple appel HTTP. Variables (Vercel, serveur uniquement) :
 * - RESEND_API_KEY : clé Resend. Sans elle, rien n'est envoyé (et l'admin le dit) ;
 * - ALERT_EMAIL : destinataire des alertes (par défaut, la 1re adresse de ADMIN_EMAILS) ;
 * - ALERT_FROM : expéditeur. Par défaut « onboarding@resend.dev », l'expéditeur
 *   d'essai de Resend, qui n'envoie qu'à l'adresse du compte Resend : suffisant
 *   pour des alertes à soi-même, sans domaine. Avec un domaine vérifié :
 *   « AcadMatch <alertes@ton-domaine> ».
 */
export interface EmailConfig {
  apiKey: string | null;
  to: string | null;
  from: string;
}

export function emailConfig(): EmailConfig {
  return {
    apiKey: process.env.RESEND_API_KEY?.trim() || null,
    to: process.env.ALERT_EMAIL?.trim() || parseAdminEmails(process.env.ADMIN_EMAILS)[0] || null,
    from: process.env.ALERT_FROM?.trim() || "AcadMatch <onboarding@resend.dev>",
  };
}

export type SendResult = { ok: true; id: string } | { ok: false; reason: string };

export async function sendEmail(message: { subject: string; text: string; html: string }, config = emailConfig()): Promise<SendResult> {
  if (!config.apiKey) return { ok: false, reason: "RESEND_API_KEY absente : alertes désactivées." };
  if (!config.to) return { ok: false, reason: "Aucun destinataire (ALERT_EMAIL ou ADMIN_EMAILS)." };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: config.from, to: [config.to], subject: message.subject, text: message.text, html: message.html }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok) return { ok: false, reason: `Resend a refusé l'envoi (${response.status}) : ${body.message ?? "erreur inconnue"}` };
    return { ok: true, id: body.id ?? "" };
  } catch {
    return { ok: false, reason: "Resend injoignable (délai dépassé ou réseau)." };
  }
}
