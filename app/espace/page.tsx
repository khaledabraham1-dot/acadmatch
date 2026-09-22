import { AppShell } from "@/components/shell/AppShell";
import { EspaceView } from "@/components/espace/EspaceView";

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
