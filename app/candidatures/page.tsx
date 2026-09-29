import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/site";
import { AppShell } from "@/components/shell/AppShell";
import { ApplicationsView } from "@/components/applications/ApplicationsView";

export const metadata: Metadata = {
  title: "Suivi des candidatures",
  robots: PRIVATE_PAGE_ROBOTS,
};

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
