import { cn } from "@/lib/utils";
import type { CompatibilityTone } from "@/lib/matching/labels";

const TONE_CLASSES: Record<CompatibilityTone | "neutral", string> = {
  success: "bg-blue-50 text-blue-700",
  // « Compatible » : encre neutre, pour rester distinct du vert « Très compatible ».
  info: "bg-slate-900/[0.07] text-slate-900",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-rose-50 text-rose-700",
  neutral: "bg-slate-100 text-slate-600",
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
