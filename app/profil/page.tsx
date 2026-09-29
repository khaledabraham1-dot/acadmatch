import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata: Metadata = {
  title: "Analyser mon profil académique",
  description: "Importez votre relevé de notes ou décrivez votre parcours : AcadMatch le compare aux prérequis d'entrée des formations en France et en Belgique.",
  alternates: { canonical: "/profil" },
};

export default function ProfilPage() {
  return (
    <AppShell
      title="Mon profil académique"
      description="Renseignez votre parcours : plus il est précis, plus l'analyse de compatibilité sera fiable."
    >
      <Suspense>
        <ProfileForm />
      </Suspense>
    </AppShell>
  );
}
