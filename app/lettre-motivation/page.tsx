import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/site";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { MotivationLetterView } from "@/components/motivation-letter/MotivationLetterView";

export const metadata: Metadata = {
  title: "Lettre de motivation",
  robots: PRIVATE_PAGE_ROBOTS,
};

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
