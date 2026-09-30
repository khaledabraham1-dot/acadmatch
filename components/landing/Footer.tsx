import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-100 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
        <p>© 2026 AcadMatch — aide à la décision académique, indépendante de Campus France</p>
        <nav aria-label="Informations légales" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/methode" className="hover:text-slate-600">
            Méthode du score
          </Link>
          <Link href="/mentions-legales" className="hover:text-slate-600">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="hover:text-slate-600">
            Confidentialité
          </Link>
          <Link href="/conditions" className="hover:text-slate-600">
            Conditions
          </Link>
        </nav>
      </div>
    </footer>
  );
}
