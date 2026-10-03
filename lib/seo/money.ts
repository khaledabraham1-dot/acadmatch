import { FIXED_EURO_PARITIES } from "@/data/budget";
import { convertFromEuroCents, formatCurrency, formatEuros } from "@/lib/budget";

/**
 * Montant en euros suivi de sa contre-valeur en francs CFA : la parité est
 * fixe et officielle (Trésor), donc la conversion est exacte, pas une
 * estimation — c'est ainsi que les familles d'Afrique de l'Ouest et
 * centrale budgètent, et ce qu'elles tapent dans Google (« en FCFA »).
 */
export function eurosAndCfa(cents: number): string {
  const cfa = convertFromEuroCents(cents, FIXED_EURO_PARITIES.XOF.rate, "XOF");
  return `${formatEuros(cents)} (${formatCurrency(cfa, "XOF")})`;
}
