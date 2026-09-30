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
      description="Optionnel : votre projet est sauvegardé automatiquement et vous le retrouvez sur tous vos appareils."
    >
      <AccountPanel />
    </AppShell>
  );
}
