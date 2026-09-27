import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { HEALTH_STUDIES_ACCESS, HEALTH_STUDIES_VERIFIED_AT } from "@/data/healthStudiesAccess";

/** Domaine du profil pour lequel l'encart s'affiche. */
export const HEALTH_DOMAIN = "Biologie & Santé";

/**
 * Encart « Médecine, pharmacie… » (voir data/healthStudiesAccess.ts) :
 * répond à la question n°1 des étudiants de Biologie & Santé, sans laisser
 * le catalogue suggérer une admission sur dossier qui n'existe pas.
 */
export function HealthStudiesNotice({ className }: { className?: string }) {
  const verifiedLabel = new Date(`${HEALTH_STUDIES_VERIFIED_AT}T00:00:00.000Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <aside
      role="note"
      className={
        className ??
        "rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-slate-700"
      }
    >
      <p className="font-medium text-slate-900">Médecine, pharmacie, dentaire : un accès à part</p>
      <p className="mt-1">
        Ces études ne s&apos;obtiennent pas sur dossier comme les formations du catalogue : AcadMatch ne
        les note donc pas. Voici les règles officielles pour les étudiants internationaux.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {HEALTH_STUDIES_ACCESS.map((rule) => (
          <div key={rule.country}>
            <p className="font-medium text-slate-900">{rule.title}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {rule.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Link
              href={rule.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              {rule.source.label}
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Vérifié le {verifiedLabel}.</p>
    </aside>
  );
}
