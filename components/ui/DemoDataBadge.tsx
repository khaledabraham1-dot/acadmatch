import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Rappel obligatoire partout où des formations de démonstration sont affichées :
 * ces données sont fictives et ne doivent jamais être perçues comme officielles.
 */
export function DemoDataBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200",
        className,
      )}
    >
      <Info className="size-3.5" />
      Données de démonstration — à remplacer par les données officielles
    </div>
  );
}
