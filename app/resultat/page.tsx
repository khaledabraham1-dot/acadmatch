import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ResultView } from "@/components/result/ResultView";

export default function ResultatPage() {
  return (
    <AppShell
      title="Résultats de compatibilité"
      description="Analyse détaillée, plan d'actions et comparaison — pour décider en connaissance de cause."
    >
      <Suspense>
        <ResultView />
      </Suspense>
    </AppShell>
  );
}
