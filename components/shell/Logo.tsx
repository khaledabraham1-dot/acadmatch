import { cn } from "@/lib/utils";

/**
 * Marque « Radar » : un carré dont le remplissage conique évoque un score,
 * puis le nom en Unbounded. Purement décoratif, le nom porte le sens.
 */
export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="size-6 shrink-0 rounded-[7px]"
        style={{
          background: `conic-gradient(var(--color-blue-${dark ? "400" : "600"}) 0 87%, var(--color-slate-${dark ? "700" : "200"}) 0)`,
        }}
      />
      <span className={cn("font-display text-[17px] font-semibold tracking-[-0.03em]", dark ? "text-white" : "text-slate-900")}>
        AcadMatch
      </span>
    </div>
  );
}
