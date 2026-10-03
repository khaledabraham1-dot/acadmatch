import type { StudyProgram } from "@/types";

/**
 * URL publique canonique du site. Le jour où le nom de domaine est acheté,
 * définir NEXT_PUBLIC_SITE_URL sur Vercel suffit : canonical, sitemap,
 * robots et images de partage suivent sans changer le code.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_NAME = "AcadMatch";

/** Seules les formations réelles et vérifiées ont une page publique indexable. */
export function publicFormations(formations: StudyProgram[]): StudyProgram[] {
  return formations.filter((formation) => !formation.demo);
}

/** Chemin stable de la page d'une formation (l'id ne change jamais, contrairement au nom). */
export function formationPath(formation: Pick<StudyProgram, "id">): string {
  return `/formations/${formation.id}`;
}

/** Coupe proprement un texte pour une meta description (~155 caractères, sur un mot entier). */
export function truncateForMeta(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  // Si la coupe tombe pile entre deux mots, le dernier mot est entier : on le garde.
  const wholeWords = clean[max - 1] === " " ? cut : cut.slice(0, cut.lastIndexOf(" "));
  return `${wholeWords.replace(/[,;:.\s]+$/, "")}…`;
}

/** Métadonnées d'une page outil personnelle : utile à l'étudiant, vide pour un moteur de recherche. */
export const PRIVATE_PAGE_ROBOTS = { index: false, follow: true } as const;

/** Longueur visée pour un titre de page, hors suffixe « — AcadMatch » (Google coupe vers 60-65). */
export const MAX_TITLE_LENGTH = 62;

/**
 * Titre de la page d'une formation : la variante la plus informative qui
 * tient dans MAX_TITLE_LENGTH (les noms d'établissement belges ou de
 * grandes écoles sont souvent très longs).
 */
export function formationTitle(formation: Pick<StudyProgram, "name" | "institution">): string {
  const { name, institution } = formation;
  const candidates = [
    `${name} — ${institution.name} : prérequis`,
    `${name} — ${institution.name}`,
    `${name} (${institution.city}) : prérequis et admission`,
    `${name} (${institution.city}) : prérequis`,
    `${name} (${institution.city})`,
  ];
  // Nom trop long même seul : coupé proprement sur un mot plutôt que tronqué par Google au hasard.
  return candidates.find((candidate) => candidate.length <= MAX_TITLE_LENGTH) ?? truncateForMeta(name, MAX_TITLE_LENGTH);
}

export function formationDescription(formation: StudyProgram): string {
  const { institution } = formation;
  return truncateForMeta(
    `${formation.name} — ${institution.name}, ${institution.city} (${institution.country}), ` +
      `enseigné en ${formation.language.toLowerCase()}. Prérequis d'entrée, compétences attendues et procédure ` +
      `vérifiés sur la source officielle. Testez gratuitement votre compatibilité.`,
  );
}
