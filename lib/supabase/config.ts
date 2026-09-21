/**
 * Les comptes sont une fonctionnalité optionnelle (voir docs/accounts-setup.md) :
 * AcadMatch doit continuer à fonctionner intégralement sans compte
 * (localStorage, comme depuis le début — voir lib/storage.ts). Tant que
 * Khaled n'a pas créé le projet Supabase et renseigné les variables
 * d'environnement, l'UI de compte doit se dégrader proprement plutôt que de
 * planter la page.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
