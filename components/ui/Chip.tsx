import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ChipProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function Chip({ children, onRemove, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1.5 pl-3 pr-2 text-sm text-slate-700",
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Retirer ${typeof children === "string" ? children : ""}`}
          // p-1.5 plutôt que p-0.5 : la cible tactile précédente (~18px) était
          // nettement sous la taille confortable au toucher sur mobile, alors
          // que retirer une matière/compétence est une action fréquente du
          // formulaire de profil.
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
        >
          <X className="size-3.5" />
        </button>
      )}
    </span>
  );
}

interface SuggestionChipProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export function SuggestionChip({ children, onClick, disabled }: SuggestionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition-colors",
        disabled ? "opacity-40" : "hover:border-blue-400 hover:text-blue-600",
      )}
    >
      + {children}
    </button>
  );
}
