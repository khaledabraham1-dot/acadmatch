import { ShieldAlert } from "lucide-react";

export function Disclaimer() {
  return (
    <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
      <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden />
        <div className="space-y-2">
          <p>
            <strong className="font-semibold text-slate-800">AcadMatch n&apos;est pas Campus France</strong>{" "}
            et ne remplace pas une procédure d&apos;admission. C&apos;est un outil d&apos;aide à la
            décision : il mesure une adéquation académique entre votre parcours et le contenu
            affiché d&apos;une formation (forces, lacunes, sources). Le score n&apos;est ni une
            garantie ni une probabilité d&apos;admission.
          </p>
          <p>
            Les fiches actuelles sont des formations réelles (très majoritairement en France, avec
            un premier établissement belge), vérifiées manuellement auprès de sources officielles,
            sur un périmètre volontairement limité (Data Science, IA, Informatique). Vérifiez
            toujours la page de l&apos;établissement avant de candidater.
          </p>
        </div>
      </div>
    </section>
  );
}
