/**
 * Export CSV de l'admin (2026-10-06). Séparateur « ; » et BOM UTF-8 : le
 * fichier s'ouvre directement dans Excel en français avec les accents.
 * Protection contre l'injection de formules : une cellule commençant par
 * = + - @ (texte saisi par un visiteur anonyme) est préfixée d'une apostrophe.
 */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(head: string[], rows: unknown[][]): string {
  return "\uFEFF" + [head, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n") + "\r\n";
}
