"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Logo } from "@/components/shell/Logo";
import { Button, LinkButton } from "@/components/ui/Button";

/**
 * Filet de sécurité applicatif : si un composant d'une page lève une erreur
 * (ex. accès refusé à localStorage par le navigateur), Next.js affiche cet
 * écran au lieu de faire planter toute l'application sans explication.
 */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("AcadMatch — erreur applicative interceptée :", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Une erreur inattendue est survenue</h1>
        <p className="mt-2 text-sm text-slate-500">
          Cela peut arriver si votre navigateur bloque le stockage local (navigation privée
          stricte, poste restreint). Vous pouvez réessayer ou revenir à l&apos;accueil.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>Réessayer</Button>
          <LinkButton href="/" variant="outline">
            Retour à l&apos;accueil
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
