import { ShieldAlert } from "lucide-react";

export function Disclaimer() {
  return (
    <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
      <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-slate-400" />
        <p>
          AcadMatch est un outil d&apos;aide à la décision. Le score de compatibilité mesure une
          adéquation académique entre votre parcours et le contenu affiché d&apos;une formation — il
          ne garantit en aucun cas une admission. Les formations de ce prototype sont des données
          de démonstration, à remplacer par les données officielles des établissements.
        </p>
      </div>
    </section>
  );
}
