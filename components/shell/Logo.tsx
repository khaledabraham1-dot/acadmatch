import { cn } from "@/lib/utils";

export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
        A
      </span>
      <span className={cn("text-base font-semibold tracking-tight", dark ? "text-white" : "text-slate-900")}>
        AcadMatch
      </span>
    </div>
  );
}
