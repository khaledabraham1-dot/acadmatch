import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ProfileForm } from "@/components/profile/ProfileForm";

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
