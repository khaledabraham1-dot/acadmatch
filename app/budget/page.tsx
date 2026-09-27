import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { BudgetView } from "@/components/budget/BudgetView";

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
