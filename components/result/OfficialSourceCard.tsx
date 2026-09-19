import type { Formation } from "@/types";
import { effectiveVerificationStatus } from "@/lib/data/integrity";
import { Card } from "@/components/ui/Card";
import { ExternalLink } from "lucide-react";

interface OfficialSourceCardProps {
  formation: Formation;
}

/**
 * Accès clair à la source officielle (critère de sortie Étape 7 / audit Étape 8).
 * Les fiches démo ne doivent jamais être présentées comme un lien cliquable officiel.
 */
export function OfficialSourceCard({ formation }: OfficialSourceCardProps) {
  const status = effectiveVerificationStatus(formation);

  return (
    <Card className="border-blue-100 bg-blue-50/60">
      <h2 className="mb-1 text-base font-semibold text-slate-900">Source officielle</h2>
      <p className="mb-3 text-sm text-slate-600">
        Vérifiez toujours les conditions d&apos;admission sur le site de l&apos;établissement —
        AcadMatch synthétise, il ne remplace pas la page officielle.
      </p>

      {formation.demo ? (
        <p className="text-sm text-slate-500" title={formation.source}>
          Fiche de démonstration — URL fictive : {formation.source.replace(/^https?:\/\//, "")}
        </p>
      ) : (
        <div className="space-y-1">
          <a
            href={formation.source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Ouvrir la page de la formation
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
          <p className="text-xs text-slate-500">
            {formation.institution}
            {formation.verifiedAt ? ` · fiche AcadMatch vérifiée le ${formation.verifiedAt}` : ""}
            {status === "à revérifier" ? " · à revérifier" : ""}
          </p>
        </div>
      )}

      <div className="mt-3 border-t border-blue-100 pt-3">
        <p className="text-xs font-semibold text-slate-700">Comment candidater</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{formation.applicationProcedure}</p>
        <p className="mt-1 text-xs italic text-slate-400">
          Plateforme et procédure générales — la date limite exacte de la campagne en cours n&apos;est
          fiable que sur la page officielle ci-dessus.
        </p>
      </div>
    </Card>
  );
}
