import { ClipboardList, Search, LineChart } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Partez de vos documents",
    description:
      "Importez votre relevé de notes et le programme de vos cours (compte gratuit), ou renseignez votre parcours à la main, sans compte.",
  },
  {
    icon: Search,
    title: "Choisissez une formation",
    description:
      "Parcourez des formations vérifiées en France et en Belgique, ou comparez-en 2 à 3 côte à côte.",
  },
  {
    icon: LineChart,
    title: "Obtenez votre analyse",
    description:
      "Score explicable, forces, lacunes prioritaires et lien vers la source officielle.",
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-3xl">
          Comment ça marche
        </h2>
        <p className="mt-3 text-slate-500">Trois étapes. Un compte gratuit seulement pour importer vos documents.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="relative rounded-[18px] border border-slate-200 bg-white p-6">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon className="size-5" />
              </div>
              <span className="font-display text-xs font-semibold text-blue-600">Étape {index + 1}</span>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
