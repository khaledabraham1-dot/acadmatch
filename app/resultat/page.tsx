import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ResultView } from "@/components/result/ResultView";

export default function ResultatPage() {
  return (
    <AppShell
      title="Résultats de compatibilité"
      description="Analyse détaillée de votre compatibilité avec la formation sélectionnée."
    >
      <Suspense>
        <ResultView />
      </Suspense>
    </AppShell>
  );
}
