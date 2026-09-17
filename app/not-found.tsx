import Link from "next/link";
import { Logo } from "@/components/shell/Logo";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-blue-600">404</p>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">Page introuvable</h1>
        <p className="mt-2 text-sm text-slate-500">
          Cette adresse n&apos;existe pas. Revenez à l&apos;accueil ou analysez votre profil.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkButton href="/">Accueil</LinkButton>
          <LinkButton href="/profil" variant="outline">
            Mon profil
          </LinkButton>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          <Link href="/recherche" className="hover:text-slate-600">
            Rechercher une formation
          </Link>
        </p>
      </div>
    </div>
  );
}
