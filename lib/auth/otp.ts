/** Code de connexion reçu par e-mail : 6 chiffres, espaces et tirets tolérés à la saisie. */
export function normalizeOtpCode(value: string): string {
  return value.replace(/[\s-]/g, "");
}

export function isValidOtpCode(value: string): boolean {
  return /^\d{6}$/.test(value);
}

/**
 * QR code de la double vérification (admin). Supabase le renvoie déjà préfixé
 * (« data:image/svg+xml;utf-8,<svg… ») mais sans encodage : préfixer une
 * deuxième fois donnait une image cassée (2026-10-08). On garde le SVG brut
 * et on l'encode, quel que soit le format reçu.
 */
export function qrImageSrc(qrCode: string): string {
  const svg = qrCode.startsWith("data:") ? qrCode.slice(qrCode.indexOf(",") + 1) : qrCode;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
