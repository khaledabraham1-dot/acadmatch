import Link from "next/link";
import { Logo } from "@/components/shell/Logo";
import { Footer } from "@/components/landing/Footer";
import { EDITOR, LEGAL_UPDATED_AT } from "@/data/legal";

const LEGAL_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions", label: "Conditions d'utilisation" },
] as const;

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/** Nom de l'éditeur, ou un marqueur visible tant qu'il n'est pas renseigné (data/legal.ts). */
export function EditorName() {
  return EDITOR.name ? <>{EDITOR.name}</> : <mark>[nom de l&apos;éditeur à compléter]</mark>;
}

export function ContactEmail() {
  return (
    <a href={`mailto:${EDITOR.email}`} className="font-medium text-blue-700 underline underline-offset-2">
      {EDITOR.email}
    </a>
  );
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline underline-offset-2">
      {children}
    </a>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

/** Ossature commune des pages légales : lisibles sans compte, sur mobile, et imprimables. */
export function LegalPage({
  title,
  intro,
  current,
  children,
}: {
  title: string;
  intro: React.ReactNode;
  current: (typeof LEGAL_LINKS)[number]["href"];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="AcadMatch — accueil">
            <Logo />
          </Link>
          <Link href="/profil" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Mon profil
          </Link>
        </div>
      </header>

      <main id="contenu-principal" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <nav aria-label="Pages légales" className="mb-8 flex flex-wrap gap-2 text-sm">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.href === current ? "page" : undefined}
              className={
                link.href === current
                  ? "rounded-full bg-slate-900 px-3 py-1 font-medium text-white"
                  : "rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Dernière mise à jour : {formatDate(LEGAL_UPDATED_AT)}</p>
        <div className="mt-6 text-base leading-relaxed text-slate-700">{intro}</div>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-slate-700 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
