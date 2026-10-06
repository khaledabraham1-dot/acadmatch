/** Code de connexion reçu par e-mail : 6 chiffres, espaces et tirets tolérés à la saisie. */
export function normalizeOtpCode(value: string): string {
  return value.replace(/[\s-]/g, "");
}

export function isValidOtpCode(value: string): boolean {
  return /^\d{6}$/.test(value);
}
