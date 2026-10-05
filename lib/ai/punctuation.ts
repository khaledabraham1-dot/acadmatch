/**
 * Filet de sécurité sur le texte libre produit par l'IA (lettre, retours
 * d'entretien) : le tiret long en incise trahit un texte généré et n'est pas
 * l'usage d'un étudiant. En incise, il devient une virgule ; en début de
 * ligne (puce), un tiret simple.
 */
export function naturalPunctuation(text: string): string {
  return text.replace(/^[ \t]*—[ \t]*/gm, "- ").replace(/[ \t]*—[ \t]*/g, ", ");
}
