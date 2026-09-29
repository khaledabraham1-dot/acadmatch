import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/site";
import { AppShell } from "@/components/shell/AppShell";
import { AccountPanel } from "@/components/account/AccountPanel";

export const metadata: Metadata = {
  title: "Mon compte",
  robots: PRIVATE_PAGE_ROBOTS,
};

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
