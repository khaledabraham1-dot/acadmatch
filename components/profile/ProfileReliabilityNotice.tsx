import Link from "next/link";
import type { ProfileReliability, ProfileValidation } from "@/lib/profile/validation";
import { cn } from "@/lib/utils";

const TONE: Record<
  ProfileReliability,
  { border: string; bg: string; title: string; text: string }
> = {
  insuffisant: {
    border: "border-red-100",
    bg: "bg-red-50",
    title: "text-red-900",
    text: "text-red-800",
  },
  limité: {
    border: "border-amber-100",
    bg: "bg-amber-50",
    title: "text-amber-900",
    text: "text-amber-800",
  },
  solide: {
    border: "border-emerald-100",
    bg: "bg-emerald-50",
    title: "text-emerald-900",
    text: "text-emerald-800",
  },
};

interface ProfileReliabilityNoticeProps {
  validation: ProfileValidation;
  /** Affiche un lien pour enrichir le profil (recherche / résultat). */
  editHref?: string;
  className?: string;
}

/**
 * Signal de fiabilité du profil : l'étudiant doit comprendre que le score
 * dépend de la richesse de ce qu'il a renseigné — sans jargon moteur.
 */
export function ProfileReliabilityNotice({
  validation,
  editHref,
  className,
}: ProfileReliabilityNoticeProps) {
  // Profil solide sans alerte : pas de bruit UI.
  if (validation.reliability === "solide" && validation.warnings.length === 0) {
    return null;
  }

  const tone = TONE[validation.reliability];
  const messages =
    validation.reliability === "solide"
      ? validation.warnings
      : [validation.reliabilityHint, ...validation.warnings.filter((w) => w !== validation.reliabilityHint)];

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 rounded-2xl border px-5 py-4",
        tone.border,
        tone.bg,
        className,
      )}
    >
      <div className="min-w-0">
        <p className={cn("text-sm font-semibold", tone.title)}>{validation.reliabilityLabel}</p>
        <ul className={cn("mt-1 space-y-1 text-sm", tone.text)}>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
      {editHref && validation.reliability !== "solide" && (
        <Link
          href={editHref}
          className={cn("shrink-0 text-sm font-medium underline-offset-2 hover:underline", tone.title)}
        >
          Enrichir mon profil
        </Link>
      )}
    </div>
  );
}
