import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { MotivationLetterView } from "@/components/motivation-letter/MotivationLetterView";

export default function LettreMotivationPage() {
  return (
    <AppShell
      title="Lettre de motivation"
      description="Un brouillon basé sur votre profil et la formation visée — jamais une lettre finale, toujours à relire et personnaliser."
    >
      <Suspense>
        <MotivationLetterView />
      </Suspense>
    </AppShell>
  );
}
