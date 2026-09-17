"use client";

import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shell/Logo";
import { SidebarNav } from "@/components/shell/SidebarNav";

interface AppShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SidebarContent() {
  return (
    <div className="flex h-full flex-col bg-slate-900 py-6">
      <div className="px-5 pb-6">
        <Logo dark />
      </div>
      <SidebarNav />
      <div className="mx-4 mt-6 flex items-start gap-2.5 rounded-xl bg-white/5 p-3.5 text-xs text-slate-400">
        <ShieldCheck className="size-4 shrink-0 text-slate-500" aria-hidden />
        <p>
          Formations vérifiées sur un périmètre ciblé (Data Science, IA, Informatique). Le score
          n&apos;est pas une promesse d&apos;admission.
        </p>
      </div>
    </div>
  );
}

/** Ossature commune des pages applicatives : sidebar (desktop) + drawer (mobile) + contenu. */
export function AppShell({ title, description, children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

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

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu de navigation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Fermer le menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <div className="flex justify-end px-4 pt-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fermer le menu"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="-mt-14">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        {/* Barre mobile */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <Logo />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={drawerOpen}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Menu className="size-5" />
          </button>
        </div>

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
