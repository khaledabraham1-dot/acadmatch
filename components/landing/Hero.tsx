import { LinkButton } from "@/components/ui/Button";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
          <Sparkles className="size-3.5" aria-hidden />
          Avant Campus France — clarifiez votre compatibilité
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Quelles formations françaises correspondent vraiment à votre parcours&nbsp;?
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
          AcadMatch compare votre cursus aux exigences et au contenu de formations françaises
          vérifiées, puis vous montre vos forces, vos lacunes prioritaires et les sources
          officielles — pour décider avant de postuler.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LinkButton href="/profil" size="lg" className="w-full sm:w-auto">
            Analyser mon profil
            <ArrowRight className="size-4" />
          </LinkButton>
          <LinkButton href="/recherche" variant="outline" size="lg" className="w-full sm:w-auto">
            Voir les formations
          </LinkButton>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Sans compte. Score explicable. Catalogue ciblé Data Science / IA / Informatique.
        </p>
      </div>
    </section>
  );
}
