"use client";

import { useActionState } from "react";
import { BellRing, CheckCircle2, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { sendAlertTest, type AlertTestState } from "@/app/admin/actions";

const INITIAL: AlertTestState = { ok: false, message: "" };

export interface AlertStatus {
  configured: boolean;
  to: string | null;
  cron: boolean;
}

/** État des alertes par e-mail et bouton d'essai (onglet Gestion de l'admin). */
export function AlertSettings({ status }: { status: AlertStatus }) {
  const [state, action, pending] = useActionState(sendAlertTest, INITIAL);
  const ready = status.configured && status.to;
  return (
    <div className="space-y-3 text-sm">
      <ul className="space-y-1.5">
        <Check ok={status.configured} text={status.configured ? "Clé Resend configurée" : "Clé Resend absente (RESEND_API_KEY sur Vercel)"} />
        <Check ok={Boolean(status.to)} text={status.to ? `Destinataire : ${status.to}` : "Aucun destinataire (ALERT_EMAIL ou ADMIN_EMAILS)"} />
        <Check ok={status.cron} text={status.cron ? "Envoi automatique chaque matin (7 h, heure du Bénin)" : "Envoi automatique inactif (CRON_SECRET sur Vercel)"} />
      </ul>
      <p className="text-slate-600">
        Un e-mail part seulement quand quelque chose demande votre attention : formation demandée au moins 3 fois, nouveaux avis, budget de
        l&apos;IA à 80 %, et le lundi, le catalogue à revérifier.
      </p>
      <form action={action}>
        <Button type="submit" variant="outline" size="sm" disabled={pending || !ready}>
          <BellRing className="size-4" aria-hidden />
          {pending ? "Envoi…" : "M'envoyer le résumé maintenant"}
        </Button>
      </form>
      {state.message && (
        <p role="status" className={state.ok ? "font-medium text-emerald-800" : "font-medium text-red-700"}>
          {state.message}
        </p>
      )}
    </div>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  const Icon = ok ? CheckCircle2 : CircleAlert;
  return (
    <li className="flex items-start gap-2 text-slate-800">
      <Icon className={ok ? "mt-0.5 size-4 shrink-0 text-emerald-600" : "mt-0.5 size-4 shrink-0 text-amber-600"} aria-hidden />
      {text}
    </li>
  );
}
