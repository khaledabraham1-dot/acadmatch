import { Check } from "lucide-react";
import { PROFILE_STEPS, type ProfileStep } from "@/lib/profile/steps";
import { cn } from "@/lib/utils";

interface ProfileStepperProps {
  current: ProfileStep;
  /** Étapes atteignables d'un clic (l'étape 1 doit être remplie avant les autres). */
  canOpen: (step: ProfileStep) => boolean;
  /** Étapes déjà remplies : coche au lieu du numéro. */
  isDone: (step: ProfileStep) => boolean;
  onSelect: (step: ProfileStep) => void;
}

/** En-tête des trois étapes du profil : où l'on est, ce qui reste, retour libre en arrière. */
export function ProfileStepper({ current, canOpen, isDone, onSelect }: ProfileStepperProps) {
  return (
    <nav aria-label="Étapes du profil">
      <ol className="grid grid-cols-3 gap-2">
        {PROFILE_STEPS.map(({ step, title, short, hint }) => {
          const active = step === current;
          const done = !active && isDone(step);
          const reachable = canOpen(step);
          return (
            <li key={step} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelect(step)}
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex h-full w-full items-start gap-2.5 rounded-[14px] border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300 disabled:cursor-not-allowed disabled:hover:border-slate-200",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    active ? "bg-blue-600 text-white" : done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : step}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm font-bold", reachable ? "text-slate-900" : "text-slate-500")}>
                    <span className="sr-only">Étape {step} : </span>
                    <span className="sm:hidden">{short}</span>
                    <span className="hidden sm:inline">{title}</span>
                  </span>
                  <span className="hidden break-words text-xs text-slate-600 sm:block">{hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
