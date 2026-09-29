import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/site";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { BudgetView } from "@/components/budget/BudgetView";

export const metadata: Metadata = {
  title: "Budget d'études",
  description: "Estimez le coût de vos études : frais d'inscription officiels, CVEC, logement et ressources exigées pour le visa.",
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function BudgetPage() {
  return (
    <AppShell
      title="Budget"
      description="Le coût réel d'une année d'études : frais officiels sourcés, vos hypothèses et vos ressources, toujours distingués."
    >
      <Suspense>
        <BudgetView />
      </Suspense>
    </AppShell>
  );
}
