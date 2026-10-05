import Link from "next/link";
import { FORMATIONS } from "@/data/formations";
import { domainPath } from "@/lib/seo/domains";
import { GUIDES, guidePath } from "@/lib/seo/guides";
import { publicFormations } from "@/lib/site";

const DOMAINS = [...new Set(publicFormations(FORMATIONS).map((f) => f.field))].sort((a, b) => a.localeCompare(b, "fr"));

/**
 * Pied de page de l'accueil : la page la plus forte du site distribue ses
 * liens vers les guides et les pages domaine (maillage interne), en plus des
 * pages légales.
 */
export function Footer() {
  return (
    <footer className="border-t border-slate-200 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 text-sm sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <nav aria-labelledby="footer-guides">
          <h2 id="footer-guides" className="mb-3 font-bold text-slate-900">
            Guides
          </h2>
          <ul className="space-y-1.5">
            {GUIDES.map((guide) => (
              <li key={guide.slug}>
                <Link href={guidePath(guide.slug)} className="text-slate-600 hover:text-slate-900">
                  {guide.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-domaines">
          <h2 id="footer-domaines" className="mb-3 font-bold text-slate-900">
            Formations par domaine
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-1">
            {DOMAINS.map((domain) => (
              <li key={domain}>
                <Link href={domainPath(domain)} className="text-slate-600 hover:text-slate-900">
                  {domain}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 font-bold text-slate-900">AcadMatch</h2>
          <nav aria-label="Informations légales" className="flex flex-col gap-1.5">
            <Link href="/formations" className="text-slate-600 hover:text-slate-900">
              Toutes les formations
            </Link>
            <Link href="/methode" className="text-slate-600 hover:text-slate-900">
              Méthode du score
            </Link>
            <Link href="/a-propos" className="text-slate-600 hover:text-slate-900">
              À propos et contact
            </Link>
            <Link href="/mentions-legales" className="text-slate-600 hover:text-slate-900">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="text-slate-600 hover:text-slate-900">
              Confidentialité
            </Link>
            <Link href="/conditions" className="text-slate-600 hover:text-slate-900">
              Conditions
            </Link>
          </nav>
          <p className="mt-4 text-slate-600">© 2026 AcadMatch, aide à la décision académique, indépendante de Campus France</p>
        </div>
      </div>
    </footer>
  );
}
