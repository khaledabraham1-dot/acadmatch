import { AppShell } from "@/components/shell/AppShell";
import { ApplicationsView } from "@/components/applications/ApplicationsView";

export default function CandidaturesPage() {
  return (
    <AppShell
      title="Suivi des candidatures"
      description="Statut, échéances personnelles, documents et prochaines actions — un espace de suivi, pas une garantie d'admission."
    >
      <ApplicationsView />
    </AppShell>
  );
}
