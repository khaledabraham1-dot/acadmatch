import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { InterviewPrepView } from "@/components/interview/InterviewPrepView";

export default function EntretiensPage() {
  return (
    <AppShell
      title="Préparation aux entretiens"
      description="Les questions qu'un jury poserait à votre profil pour cette formation — vos réponses, avec un retour pour les améliorer."
    >
      <Suspense>
        <InterviewPrepView />
      </Suspense>
    </AppShell>
  );
}
