import { getCompatibilityLabel } from "@/lib/matching/labels";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/** Le score en grand (identité Radar) : le chiffre d'abord, son libellé juste à côté. */
export function ScoreHeadline({
  score,
  size = "lg",
  estimate = false,
  className,
}: {
  score: number;
  size?: "md" | "lg";
  /** Score plafonné faute de preuves (CompatibilityResult.evidenceCapped). */
  estimate?: boolean;
  className?: string;
}) {
  const { label, tone } = getCompatibilityLabel(score);
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <p
        className={cn(
          "font-display font-semibold leading-[0.9] tracking-[-0.05em]",
          tone === "success" ? "text-blue-600" : "text-slate-900",
          size === "lg" ? "text-7xl" : "text-5xl",
        )}
      >
        {score}
      </p>
      <div className="grid gap-1">
        <Badge tone={tone}>{label}</Badge>
        <p className="text-sm text-slate-500">{estimate ? "sur 100 · estimation, profil incomplet" : "sur 100"}</p>
      </div>
    </div>
  );
}
