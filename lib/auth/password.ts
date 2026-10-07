/**
 * Connexion par mot de passe (2026-10-07). Règles et messages en fonctions
 * pures, testées (lib/auth/password.test.ts). Supabase applique de son côté
 * sa propre longueur minimale ; celle-ci est volontairement plus exigeante.
 */
export const PASSWORD_MIN_LENGTH = 8;

/** Message d'erreur à afficher, ou null si le mot de passe est acceptable. */
export function passwordProblem(password: string, confirmation?: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  if (password.length > 72) return "Le mot de passe ne doit pas dépasser 72 caractères.";
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  if (confirmation !== undefined && password !== confirmation) return "Les deux mots de passe ne correspondent pas.";
  return null;
}

/** Erreur renvoyée par Supabase Auth (code stable quand il existe, sinon statut HTTP). */
export interface AuthErrorLike {
  code?: string;
  status?: number;
}

/** Traduit une erreur de Supabase Auth en message compréhensible par un étudiant. */
export function authErrorMessage(error: AuthErrorLike, context: "signin" | "signup" | "reset" | "update"): string {
  switch (error.code) {
    case "invalid_credentials":
      return "E-mail ou mot de passe incorrect. Si vous vous connectiez jusqu'ici avec un code reçu par e-mail, choisissez « Mot de passe oublié » pour créer votre mot de passe.";
    case "email_not_confirmed":
      return "Votre adresse n'est pas encore confirmée : cliquez sur le lien reçu par e-mail lors de l'inscription.";
    case "weak_password":
      return "Mot de passe trop faible. Allongez-le et mélangez lettres, chiffres et symboles.";
    case "same_password":
      return "Choisissez un mot de passe différent de l'actuel.";
    case "user_already_exists":
    case "email_exists":
      return "Un compte existe déjà avec cette adresse : connectez-vous, ou choisissez « Mot de passe oublié ».";
    case "reauthentication_needed":
      return "Par sécurité, reconnectez-vous puis recommencez.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Trop de tentatives en peu de temps. Patientez une minute puis réessayez.";
  }
  if (error.status === 429) return "Trop de tentatives en peu de temps. Patientez une minute puis réessayez.";
  if (context === "signin") return "Connexion impossible pour le moment. Réessayez dans un instant.";
  if (context === "signup") return "Le compte n'a pas pu être créé. Vérifiez l'adresse et réessayez.";
  if (context === "reset") return "L'e-mail n'a pas pu être envoyé. Vérifiez l'adresse et réessayez.";
  return "Le mot de passe n'a pas pu être enregistré. Réessayez dans un instant.";
}
