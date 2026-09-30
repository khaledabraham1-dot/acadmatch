import { CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RadarChart } from "@/components/result/RadarChart";
import { ScoreHeadline } from "@/components/result/ScoreHeadline";
import { TryExampleButton } from "@/components/landing/TryExampleButton";
import { bestExampleResult } from "@/lib/landing/exampleResult";

/** Le vrai résultat du moteur pour le profil exemple, présenté comme sur la page Résultat. */
export function ExampleResultPreview() {
  const { formation, result } = bestExampleResult();

  return (
    <section id="exemple" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-3xl">
          Un résultat clair et explicable
        </h2>
        <p className="mt-3 text-slate-600">
          Calcul réel pour le profil exemple (Licence 3 Informatique) face au {formation.name},{" "}
          {formation.institution.name}.
        </p>
      </div>

      <Card className="max-w-4xl">
        <div className="grid items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10">
          <ScoreHeadline score={result.overallScore} />
          <RadarChart breakdown={result.breakdown} className="mx-auto max-w-[340px]" />
        </div>

        <div className="mt-8 grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-700">
              <CheckCircle2 className="size-4" aria-hidden />
              Points forts
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {result.strengths.slice(0, 5).map((item) => (
                <li key={item} className="rounded-[10px] border border-blue-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-800">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-rose-700">
              <AlertCircle className="size-4" aria-hidden />
              À combler avant de candidater
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {result.gaps.slice(0, 5).map((item) => (
                <li key={item} className="rounded-[10px] border border-dashed border-rose-400 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-800">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <TryExampleButton label="Tester avec un profil exemple" />
        </div>
      </Card>
    </section>
  );
}
