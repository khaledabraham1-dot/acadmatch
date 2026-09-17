import type { Formation } from "@/types";
import { Card } from "@/components/ui/Card";
import { ExternalLink } from "lucide-react";

interface OfficialSourceCardProps {
  formation: Formation;
}

/**
 * Accès clair à la source officielle (critère de sortie Étape 7).
 * Les fiches démo ne doivent jamais être présentées comme un lien cliquable officiel.
 */
export function OfficialSourceCard({ formation }: OfficialSourceCardProps) {
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
            {formation.verificationStatus === "à revérifier" ? " · à revérifier" : ""}
          </p>
        </div>
      )}
    </Card>
  );
}
