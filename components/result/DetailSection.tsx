import { ChevronDown } from "lucide-react";

/**
 * Bloc d'analyse replié (élément natif <details> : clavier, lecteurs d'écran
 * et recherche dans la page fonctionnent sans JavaScript).
 */
export function DetailSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-white px-5 py-4 hover:border-slate-300 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-base font-bold text-slate-900">{title}</span>
          <span className="block text-sm text-slate-600">{hint}</span>
        </span>
        <ChevronDown className="size-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  );
}
