import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/site";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ResultView } from "@/components/result/ResultView";

export const metadata: Metadata = {
  title: "Résultats de compatibilité",
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function ResultatPage() {
  return (
    <AppShell
      title="Résultats de compatibilité"
      description="Votre verdict, vos prochaines actions, puis le détail du calcul, pour décider en connaissance de cause."
    >
      <Suspense>
        <ResultView />
      </Suspense>
    </AppShell>
  );
}
