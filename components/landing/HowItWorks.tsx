import { ClipboardList, Search, LineChart } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Renseignez votre parcours",
    description:
      "Niveau, diplôme, domaine, matières étudiées et compétences — en quelques minutes, sans compte.",
  },
  {
    icon: Search,
    title: "Choisissez une formation",
    description:
      "Recherchez une formation française parmi notre base de démonstration et sélectionnez-la.",
  },
  {
    icon: LineChart,
    title: "Obtenez votre analyse",
    description:
      "Un score de compatibilité détaillé, vos points forts, vos lacunes et les points à vérifier.",
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Comment ça marche
        </h2>
        <p className="mt-3 text-slate-500">Trois étapes, aucune inscription.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon className="size-5" />
              </div>
              <span className="text-xs font-semibold text-blue-600">Étape {index + 1}</span>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
