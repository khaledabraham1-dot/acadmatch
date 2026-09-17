"use client";

import { useRouter } from "next/navigation";
import { EXAMPLE_STUDENT_PROFILE } from "@/data/example-profile";
import { saveProfile } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { FlaskConical } from "lucide-react";

interface TryExampleButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Destination après chargement du profil exemple. */
  nextHref?: string;
  label?: string;
}

/**
 * Onboarding MVP : charge un profil réaliste et emmène l'utilisateur vers la recherche.
 */
export function TryExampleButton({
  variant = "outline",
  size = "lg",
  className,
  nextHref = "/recherche",
  label = "Essayer un exemple",
}: TryExampleButtonProps) {
  const router = useRouter();

  function handleClick() {
    saveProfile(EXAMPLE_STUDENT_PROFILE);
    router.push(nextHref);
  }

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={handleClick}>
      <FlaskConical className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
