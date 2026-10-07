import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { LoginForm } from "@/components/account/LoginForm";
import { AdminMfa } from "@/components/admin/AdminMfa";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { adminHref, checkAdmin } from "@/lib/admin/session";
import { loadDashboard } from "@/lib/admin/loadDashboard";
import { ADMIN_MAX_SESSION_HOURS } from "@/lib/admin/access";
import { emailConfig } from "@/lib/email/resend";

export const metadata: Metadata = {
  title: "Espace privé",
  robots: { index: false, follow: false },
};

// Données en direct, jamais mises en cache ni générées au build.
export const dynamic = "force-dynamic";

/**
 * Espace admin V3 (2026-10-07). N'est servi qu'à l'adresse secrète
 * (ADMIN_PATH, voir proxy.ts) ; /admin tapé directement donne une page
 * introuvable. Trois verrous successifs (lib/admin/session.ts) : adresse
 * dans ADMIN_EMAILS, connexion de moins de 12 h, code de l'application
 * d'authentification. Toute autre personne connectée reçoit 404, et la page
 * de connexion ne mentionne jamais l'administration.
 */
export default async function AdminPage() {
  const access = await checkAdmin();
  const home = adminHref();

  if (access.status === "anonymous") {
    return (
      <AppShell title="Espace privé" description="Connectez-vous pour continuer.">
        <div className="max-w-xl">
          <LoginForm afterLogin={home} signInOnly title="Se connecter" intro="Saisissez votre adresse et votre mot de passe." />
        </div>
      </AppShell>
    );
  }
  if (access.status === "reauth") {
    return (
      <AppShell title="Espace privé" description="Pour protéger les données, cet espace demande une connexion récente.">
        <div className="max-w-xl">
          <LoginForm
            presetEmail={access.email}
            afterLogin={home}
            signInOnly
            title="Confirmez votre identité"
            intro={`Votre dernière connexion date de plus de ${ADMIN_MAX_SESSION_HOURS} heures. Reconnectez-vous pour continuer.`}
          />
        </div>
      </AppShell>
    );
  }
  if (access.status === "mfa-enroll" || access.status === "mfa-verify") {
    return (
      <AppShell title="Espace privé" description="Deuxième étape : le code de votre téléphone.">
        <div className="max-w-xl">
          <AdminMfa mode={access.status === "mfa-enroll" ? "enroll" : "verify"} />
        </div>
      </AppShell>
    );
  }
  if (access.status !== "admin") notFound();

  const initial = await loadDashboard(30);
  const mail = emailConfig();
  const alerts = { configured: Boolean(mail.apiKey), to: mail.to, cron: Boolean(process.env.CRON_SECRET) };
  return (
    <AppShell title="Pilotage AcadMatch" description="Données en direct, actualisées toutes les 30 secondes. Aucune donnée personnelle.">
      <AdminDashboard initial={initial} base={home} email={access.email} alerts={alerts} />
    </AppShell>
  );
}
