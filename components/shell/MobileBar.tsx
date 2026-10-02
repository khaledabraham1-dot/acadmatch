"use client";

import { useCallback, useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/shell/Logo";
import { MobileMenu } from "@/components/shell/MobileMenu";

/** Barre mobile et menu en tuiles : seule partie interactive de l'ossature (AppShell). */
export function MobileBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Stable : MobileMenu s'en sert dans un effet (verrou du défilement, touche Échap).
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      {drawerOpen && <MobileMenu onClose={closeDrawer} />}
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
    </>
  );
}
