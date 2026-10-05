"use client";

import type { ReactNode } from "react";
import { FileCheck2, LogIn } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { useAiAccess } from "@/components/ai/AiFeature";

/**
 * Premier écran d'un nouveau visiteur sur le profil : partir de ses
 * documents plutôt que d'un formulaire vide. C'est la façon dont un jury
 * lit un dossier (relevé = ce qui a été suivi, programme = ce que les cours
 * contenaient), et c'est aussi la façon la plus fiable de remplir le profil :
 * un étudiant qui saisit à la main liste rarement plus de quelques matières.
 * La saisie manuelle reste juste en dessous, sans compte.
 */
export function DocumentQuickStart({
  transcriptImport,
  syllabusImport,
}: {
  transcriptImport: ReactNode;
  syllabusImport: ReactNode;
}) {
  const { configured, user, authLoading } = useAiAccess();
  if (!configured || authLoading) return null;

  return (
    <Card className="border-blue-200 ring-1 ring-blue-100">
      <div className="flex items-start gap-3">
        <FileCheck2 className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">Démarrez avec vos documents (recommandé)</h2>
          <p className="mt-1 text-sm text-slate-600">
            Comme un jury d&apos;admission, AcadMatch lit ce que vous avez réellement étudié : votre{" "}
            <strong>relevé de notes</strong> (matières suivies, niveau), puis, si vous l&apos;avez, le{" "}
            <strong>programme de vos cours</strong> (ce qu&apos;ils contenaient). Vous vérifiez chaque ligne avant
            qu&apos;elle entre dans votre profil.
          </p>
        </div>
      </div>

      {user ? (
        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Relevé de notes</p>
            {transcriptImport}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
              Programme des cours (optionnel)
            </p>
            {syllabusImport}
          </div>
          <p className="text-xs text-slate-500">
            Ensuite, vérifiez ci-dessous les matières et compétences retenues : vous pouvez en ajouter ou en
            retirer.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            L&apos;import demande un compte gratuit (connexion par lien e-mail, sans mot de passe) ; vos documents ne
            sont jamais conservés. Sinon, ajoutez vos matières ci-dessous, sans compte.
          </p>
          <LinkButton href="/compte?next=/profil" size="sm" className="shrink-0">
            <LogIn className="size-4" aria-hidden />
            Me connecter pour importer
          </LinkButton>
        </div>
      )}
    </Card>
  );
}
