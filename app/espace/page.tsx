import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/site";
import { AppShell } from "@/components/shell/AppShell";
import { EspaceView } from "@/components/espace/EspaceView";

export const metadata: Metadata = {
  title: "Mon espace",
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function EspacePage() {
  return (
    <AppShell
      title="Mon espace"
      description="Profil, formations sauvegardées et comparaisons en cours, réunis au même endroit."
    >
      <EspaceView />
    </AppShell>
  );
}
