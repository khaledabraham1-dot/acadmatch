import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { VisaView } from "@/components/visa/VisaView";

export const metadata: Metadata = {
  title: "Visa étudiant pour la France et la Belgique : les étapes",
  description: "Votre parcours visa étudiant selon votre nationalité et votre pays de résidence : Études en France, démarches consulaires, liens officiels.",
  alternates: { canonical: "/visa" },
};

export default function VisaPage() {
  return (
    <AppShell
      title="Visa"
      description="Votre parcours visa selon votre situation : les bonnes étapes, les liens officiels et vos ressources."
    >
      <Suspense>
        <VisaView />
      </Suspense>
    </AppShell>
  );
}
