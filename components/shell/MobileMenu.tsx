"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Logo } from "@/components/shell/Logo";
import { NAV_GROUPS, NAV_ITEMS } from "@/components/shell/nav-items";
import { cn } from "@/lib/utils";
import { SyncBadge } from "@/components/account/SyncStatus";

/**
 * Menu mobile en tuiles (identité Radar), plein écran. Il défile seul
 * (overflow-y-auto + overscroll-contain) et bloque le défilement de la page
 * derrière tant qu'il est ouvert : avant, le geste faisait défiler la page
 * au lieu des rubriques. Échap et chaque lien le ferment.
 */
export function MobileMenu({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-slate-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <Link href="/" onClick={onClose} aria-label="AcadMatch, accueil">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le menu"
          className="grid size-11 place-items-center rounded-[12px] border border-slate-200 bg-white text-slate-900"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="grid gap-5 px-4 pb-8 pt-4" aria-label="Navigation principale">
        <SyncBadge />
        {NAV_GROUPS.map((group) => (
          <section key={group} className="grid gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">{group}</h2>
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[88px] flex-col justify-between gap-2 rounded-[16px] border p-3 text-sm font-bold leading-tight",
                      active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 place-items-center rounded-[9px]",
                        active ? "bg-white/10 text-blue-300" : "bg-blue-50 text-blue-700",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
        <p className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-slate-500">
          <Link href="/methode" onClick={onClose}>Méthode du score</Link>
          <Link href="/a-propos" onClick={onClose}>À propos et contact</Link>
          <Link href="/mentions-legales" onClick={onClose}>Mentions légales</Link>
          <Link href="/confidentialite" onClick={onClose}>Confidentialité</Link>
          <Link href="/conditions" onClick={onClose}>Conditions</Link>
        </p>
      </nav>
    </div>
  );
}
