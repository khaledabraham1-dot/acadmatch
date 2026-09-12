import { Logo } from "@/components/shell/Logo";
import { LinkButton } from "@/components/ui/Button";

export function LandingNav() {
  return (
    <header className="border-b border-slate-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 sm:flex">
          <a href="#comment-ca-marche" className="hover:text-slate-900">
            Comment ça marche
          </a>
          <a href="#exemple" className="hover:text-slate-900">
            Exemple de résultat
          </a>
        </nav>
        <LinkButton href="/profil" size="sm">
          Analyser mon profil
        </LinkButton>
      </div>
    </header>
  );
}
