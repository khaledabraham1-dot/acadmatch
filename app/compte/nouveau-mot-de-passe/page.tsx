import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/site";
import { AppShell } from "@/components/shell/AppShell";
import { NewPasswordPanel } from "@/components/account/NewPasswordPanel";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function NouveauMotDePassePage() {
  return (
    <AppShell title="Nouveau mot de passe" description="Choisissez le mot de passe que vous utiliserez pour vous connecter.">
      <NewPasswordPanel />
    </AppShell>
  );
}
