import { LinkButton } from "@/components/ui/Button";
import { TryExampleButton } from "@/components/landing/TryExampleButton";
import { ArrowRight, Sparkles } from "lucide-react";
import { FORMATIONS } from "@/data/formations";
import { DOMAINS } from "@/data/subjects";

// Chiffres tirés du catalogue lui-même : la page d'accueil ne peut plus décrire un périmètre dépassé.
const FORMATION_COUNT = FORMATIONS.filter((f) => !f.demo).length;
const COUNTRIES = [...new Set(FORMATIONS.map((f) => f.institution.country))];

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
          <Sparkles className="size-3.5" aria-hidden />
          Avant Campus France — clarifiez votre compatibilité
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Quelles formations en France et en Belgique correspondent vraiment à votre parcours&nbsp;?
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
          Importez votre relevé de notes et le programme de vos cours : AcadMatch les lit comme un
          jury d&apos;admission et les compare aux exigences d&apos;entrée de formations vérifiées sur
          leurs sources officielles — vos forces, vos lacunes prioritaires, pour décider avant de
          postuler.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LinkButton href="/profil" size="lg" className="w-full sm:w-auto">
            Analyser mon profil
            <ArrowRight className="size-4" />
          </LinkButton>
          <TryExampleButton className="w-full sm:w-auto" />
        </div>
        <p className="mt-3">
          <LinkButton href="/recherche" variant="ghost" size="sm">
            Voir les formations sans profil
          </LinkButton>
        </p>
        <p className="mt-4 text-sm text-slate-400">
          {FORMATION_COUNT} formations vérifiées · {DOMAINS.length} domaines · {COUNTRIES.join(" et ")}. Score
          explicable. Import de documents avec un compte gratuit, saisie manuelle sans compte.
        </p>
      </div>
    </section>
  );
}
