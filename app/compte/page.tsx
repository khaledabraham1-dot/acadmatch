import { AppShell } from "@/components/shell/AppShell";
import { AccountPanel } from "@/components/account/AccountPanel";

export default function ComptePage() {
  return (
    <AppShell
      title="Mon compte"
      description="Optionnel : sauvegardez votre profil pour le retrouver sur un autre appareil."
    >
      <AccountPanel />
    </AppShell>
  );
}
