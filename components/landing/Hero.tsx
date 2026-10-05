import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { TryExampleButton } from "@/components/landing/TryExampleButton";
import { RadarChart } from "@/components/result/RadarChart";
import { ScoreHeadline } from "@/components/result/ScoreHeadline";
import { FORMATIONS } from "@/data/formations";
import { DOMAINS } from "@/data/subjects";
import { bestExampleResult } from "@/lib/landing/exampleResult";

// Chiffres tirés du catalogue lui-même : la page d'accueil ne peut plus décrire un périmètre dépassé.
const FORMATION_COUNT = FORMATIONS.filter((f) => !f.demo).length;
const COUNTRIES = [...new Set(FORMATIONS.map((f) => f.institution.country))];

export function Hero() {
  const example = bestExampleResult();

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:pb-20">
      <div className="min-w-0">
        <p className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-sm font-bold text-slate-500">
          <span>Votre relevé</span>
          <span aria-hidden>·</span>
          <span>Les vrais prérequis</span>
          <span aria-hidden>·</span>
          <span className="text-blue-600">Un score clair</span>
        </p>
        <h1 className="text-[2rem] font-semibold leading-[1.08] text-slate-900 sm:text-[2.6rem]">
          Quelles formations en France et en Belgique correspondent vraiment à votre parcours&nbsp;?
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
          Importez votre relevé de notes : AcadMatch le compare aux exigences d&apos;entrée de{" "}
          {FORMATION_COUNT} licences et masters, vérifiées sur leurs pages officielles. Vous voyez vos
          forces et ce qu&apos;il vous manque, avant de candidater.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <LinkButton href="/profil" size="lg" className="w-full sm:w-auto">
            Analyser mon profil
            <ArrowRight className="size-4" aria-hidden />
          </LinkButton>
          <TryExampleButton className="w-full sm:w-auto" />
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
          {[
            `${FORMATION_COUNT} formations · ${DOMAINS.length} domaines · ${COUNTRIES.join(" et ")}`,
            "Sources officielles datées",
            "Gratuit",
          ].map((fact) => (
            <li key={fact} className="flex items-center gap-1.5">
              <Check className="size-4 text-blue-600" aria-hidden />
              {fact}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/formations" className="font-bold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">
            Voir les formations sans profil
          </Link>
        </p>
      </div>

      {/* Démo : le vrai calcul du moteur pour le profil exemple, pas une illustration. */}
      <div className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Exemple · L3 Informatique</span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
            <span className="size-2 animate-pulse rounded-full bg-blue-600" aria-hidden />
            calcul réel du moteur
          </span>
        </div>
        <div className="mt-4 grid grid-cols-[110px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
          <RadarChart breakdown={example.result.breakdown} compact />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{example.formation.name}</p>
            <p className="mb-3 text-xs text-slate-500">
              {example.formation.institution.name} · {example.formation.institution.city}
            </p>
            <ScoreHeadline score={example.result.overallScore} size="md" />
          </div>
        </div>
      </div>
    </section>
  );
}
