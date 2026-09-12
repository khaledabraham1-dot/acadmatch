export type CompatibilityTone = "success" | "info" | "warning" | "danger";

export interface CompatibilityLabel {
  label: string;
  tone: CompatibilityTone;
}

/**
 * Traduit un score numérique en un libellé lisible et une tonalité de couleur.
 * Seuils volontairement simples et documentés ici pour rester explicables.
 */
export function getCompatibilityLabel(score: number): CompatibilityLabel {
  if (score >= 85) return { label: "Très compatible", tone: "success" };
  if (score >= 65) return { label: "Compatible", tone: "info" };
  if (score >= 45) return { label: "Partiellement compatible", tone: "warning" };
  return { label: "Peu compatible", tone: "danger" };
}
