import { cn } from "@/lib/utils";
import type { CompatibilityTone } from "@/lib/matching/labels";

const TONE_CLASSES: Record<CompatibilityTone | "neutral", string> = {
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  info: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  neutral: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

interface BadgeProps {
  tone?: CompatibilityTone | "neutral";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ tone = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
