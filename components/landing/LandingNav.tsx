import { Logo } from "@/components/shell/Logo";
import { LinkButton } from "@/components/ui/Button";

export function LandingNav() {
  return (
    <header className="border-b border-slate-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 sm:flex">
          <a href="#comment-ca-marche" className="hover:text-slate-900">
            Comment ça marche
          </a>
          <a href="#exemple" className="hover:text-slate-900">
            Exemple de résultat
          </a>
          <a href="/recherche" className="hover:text-slate-900">
            Formations
          </a>
        </nav>
        {/*
          Vérifié au navigateur à 320px : "Analyser mon profil" ne tenait pas
          sur une ligne dans l'espace restant une fois le logo casé (justify-
          between ne garantit aucun espace minimal), le texte repassait à la
          ligne et débordait du bouton à hauteur fixe. whitespace-nowrap +
          libellé plus court en dessous de sm (repris du 404, app/not-found.tsx)
          règle les deux à la fois sans réduire la portée du texte sur desktop.
        */}
        <LinkButton href="/profil" size="sm" className="shrink-0 whitespace-nowrap">
          <span className="sm:hidden">Mon profil</span>
          <span className="hidden sm:inline">Analyser mon profil</span>
        </LinkButton>
      </div>
    </header>
  );
}
