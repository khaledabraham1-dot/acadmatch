import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/site";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { InterviewPrepView } from "@/components/interview/InterviewPrepView";

export const metadata: Metadata = {
  title: "Préparation aux entretiens",
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function EntretiensPage() {
  return (
    <AppShell
      title="Préparation aux entretiens"
      description="Les questions qu'un jury poserait à votre profil pour cette formation, et un retour sur vos réponses pour les améliorer."
    >
      <Suspense>
        <InterviewPrepView />
      </Suspense>
    </AppShell>
  );
}
