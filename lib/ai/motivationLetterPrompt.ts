import type { StudentProfile, StudyProgram } from "@/types";

/**
 * Construction du prompt pour l'assistant de lettre de motivation (Phase 17)
 * — logique pure (aucun appel réseau), testable indépendamment de callAi.
 *
 * Contrainte non négociable de la phase : "N'invente aucune expérience,
 * compétence, diplôme ou résultat." Le system prompt liste explicitement
 * les seules informations autorisées (celles du profil et de la formation
 * fournies ici) et interdit toute invention en toutes lettres, à deux
 * endroits (consigne générale + rappel juste avant la génération) — un
 * choix délibéré de redondance vu le risque (mentir sur son parcours dans
 * une vraie candidature).
 */

const SYSTEM_PROMPT = `Tu es un assistant d'aide à la rédaction de lettres de motivation pour des candidatures à des formations en France ou en Belgique.

Règle absolue, plus importante que le style ou la longueur : tu n'as le droit d'utiliser QUE les informations fournies explicitement dans le message de l'utilisateur (son profil académique et la formation visée). Tu n'inventes JAMAIS une expérience, un stage, un projet, une compétence, un diplôme, une note ou un résultat qui n'est pas mentionné. Si le profil est succinct, écris un brouillon plus court plutôt que de compenser en inventant du contenu — un étudiant qui soumettrait une information fausse dans une vraie candidature prend un risque réel.

Le texte que tu produis est un BROUILLON de départ, pas une lettre finale : l'étudiant le relira et le modifiera toujours avant tout envoi. Écris en français, ton sincère et concret (pas de formules creuses), 250 à 400 mots, structuré en 3-4 paragraphes (motivation pour cette formation précise, lien entre le parcours réel de l'étudiant et son contenu/ses prérequis, projet/objectif, formule de politesse).`;

function formatProfile(profile: StudentProfile): string {
  const lines = [
    `Niveau actuel : ${profile.currentLevel}`,
    `Diplôme actuel / en cours : ${profile.currentDegree}`,
    `Domaine d'études : ${profile.fieldOfStudy}`,
    `Objectif : ${profile.goal}`,
    `Langues : ${profile.languages.join(", ")}`,
  ];
  if (profile.courses.length > 0) {
    lines.push(`Matières suivies : ${profile.courses.map((c) => c.name).join(", ")}`);
  }
  if (profile.skills.length > 0) {
    lines.push(`Compétences : ${profile.skills.join(", ")}`);
  }
  if (profile.academicStanding) {
    lines.push(`Auto-évaluation du dossier : ${profile.academicStanding}`);
  }
  return lines.join("\n");
}

function formatFormation(formation: StudyProgram): string {
  const lines = [
    `Nom : ${formation.name}`,
    `Établissement : ${formation.institution.name} (${formation.institution.city}, ${formation.institution.country})`,
    `Diplôme visé : ${formation.goal}`,
    `Domaine : ${formation.field}`,
    `Langue d'enseignement : ${formation.language}`,
    `Description officielle : ${formation.description}`,
  ];
  if (formation.coreCourses.length > 0) {
    lines.push(`Matières fondamentales : ${formation.coreCourses.map((c) => c.name).join(", ")}`);
  }
  if (formation.prerequisites.length > 0) {
    lines.push(`Prérequis : ${formation.prerequisites.map((p) => p.label).join(", ")}`);
  }
  return lines.join("\n");
}

export interface MotivationLetterPrompt {
  system: string;
  user: string;
}

export function buildMotivationLetterPrompt(profile: StudentProfile, formation: StudyProgram): MotivationLetterPrompt {
  const user = `Voici mon profil :
${formatProfile(profile)}

Voici la formation que je vise :
${formatFormation(formation)}

Rédige un brouillon de lettre de motivation en utilisant uniquement ces informations. N'invente aucune expérience, compétence, diplôme ou résultat que je n'ai pas mentionné ci-dessus.`;

  return { system: SYSTEM_PROMPT, user };
}
