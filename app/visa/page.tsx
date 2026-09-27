import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { VisaView } from "@/components/visa/VisaView";

export default function VisaPage() {
  return (
    <AppShell
      title="Visa"
      description="Votre parcours visa selon votre situation : les bonnes étapes, les liens officiels et vos ressources."
    >
      <Suspense>
        <VisaView />
      </Suspense>
    </AppShell>
  );
}
