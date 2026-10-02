import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shell/Logo";
import { SidebarNav } from "@/components/shell/SidebarNav";
import { MobileBar } from "@/components/shell/MobileBar";
import { SyncBadge } from "@/components/account/SyncStatus";
import { FORMATIONS } from "@/data/formations";
import { coveredDomains, formatList } from "@/lib/search/filters";

interface AppShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SidebarContent() {
  return (
    // overflow-y-auto : avec 12 entrées, la sidebar dépasse un écran de portable (~730px
    // utiles) — sans défilement, l'encart et les liens légaux du bas étaient inaccessibles.
    <div className="flex h-full flex-col overflow-y-auto bg-slate-900 py-6 [color-scheme:dark]">
      <div className="px-5 pb-6">
        <Logo dark />
      </div>
      <SidebarNav />
      {/* Fond sombre : gris clairs (slate-300/400), jamais les gris « texte secondaire » des fonds clairs. */}
      <div className="mx-4 mt-6 flex items-start gap-2.5 rounded-xl bg-white/5 p-3.5 text-xs text-slate-300">
        <ShieldCheck className="size-4 shrink-0 text-slate-400" aria-hidden />
        <p>
          Formations vérifiées sur un périmètre ciblé ({formatList(coveredDomains(FORMATIONS))}). Le score
          n&apos;est pas une promesse d&apos;admission.
        </p>
      </div>
      <div className="mt-auto px-5 pt-6">
        <SyncBadge dark />
      </div>
      <nav aria-label="Informations légales" className="flex flex-wrap gap-x-3 gap-y-1 px-5 pt-6 text-xs text-slate-300">
        <Link href="/methode" className="hover:text-white">
          Méthode du score
        </Link>
        <Link href="/mentions-legales" className="hover:text-white">
          Mentions légales
        </Link>
        <Link href="/confidentialite" className="hover:text-white">
          Confidentialité
        </Link>
        <Link href="/conditions" className="hover:text-white">
          Conditions
        </Link>
      </nav>
    </div>
  );
}

/**
 * Ossature commune des pages applicatives : sidebar (desktop) + menu (mobile) + contenu.
 * Composant serveur : la sidebar (et le catalogue qu'elle résume) n'envoie aucun
 * JavaScript au navigateur ; seul le bouton du menu mobile est interactif (MobileBar).
 */
export function AppShell({ title, description, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <a href="#contenu-principal" className="skip-link">
        Aller au contenu
      </a>

      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 md:block" aria-label="Navigation principale">
        <div className="fixed inset-y-0 left-0 w-64">
          <SidebarContent />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <MobileBar />

        <main id="contenu-principal" className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
              {description && <p className="mt-2 text-slate-500">{description}</p>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
