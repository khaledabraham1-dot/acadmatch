import type { CompatibilityResult, StudentProfile, StudyProgram } from "@/types";
import { EVIDENCE_FULL_ITEMS, profileEvidenceCount } from "@/lib/matching/engine";
import type { DecisionAid } from "@/lib/matching/explanation";
import { validTranscriptAverage } from "@/lib/profile/grades";
import { selectivityOf, selectivityTier } from "@/lib/selectivity";
import { normalize } from "@/lib/utils";

/**
 * Haut de la page résultat (2026-10-02) : un verdict d'une phrase, puis trois
 * actions concrètes. L'analyse détaillée existe toujours, repliée en dessous :
 * un étudiant doit savoir en quelques secondes où il en est et quoi faire
 * ensuite, pas lire dix cartes. Règles pures, sans IA, testées.
 */

export interface NextStep {
  title: string;
  detail: string;
  href?: string;
  /** Lien vers un site externe (page officielle de la formation). */
  external?: boolean;
}

function teachesInStudentLanguage(profile: StudentProfile, formation: StudyProgram): boolean {
  return profile.languages.some((lang) => normalize(lang) === normalize(formation.language));
}

/**
 * La phrase qui résume le score : la raison la plus déterminante d'abord (profil
 * non évaluable, autre domaine, profil trop mince…), sinon le niveau d'adéquation.
 */
export function buildVerdict(profile: StudentProfile, formation: StudyProgram, result: CompatibilityResult): string {
  if (result.noContentMatch) {
    return "Votre profil ne permet pas encore d'évaluer cette formation : aucune de vos matières ne correspond à son programme.";
  }
  if (result.domainExcluded) {
    return `Formation qui n'admet pas les diplômés de votre domaine (${profile.fieldOfStudy}) : vérifiez les conditions officielles avant tout.`;
  }
  if (result.domainCapped) {
    return `Formation d'un autre domaine (${formation.field}) : envisageable seulement si vous prouvez ses matières de base.`;
  }
  if (result.evidenceCapped) {
    return "Estimation provisoire : votre profil compte encore trop peu de matières pour juger votre dossier.";
  }
  if (formation.goal !== profile.goal) {
    return `Cette formation (${formation.goal}) ne correspond pas à votre objectif (${profile.goal}).`;
  }
  if (!teachesInStudentLanguage(profile, formation)) {
    return `Formation enseignée en ${formation.language}, une langue que vous n'avez pas indiquée : c'est le premier point à régler.`;
  }
  const score = result.overallScore;
  if (score >= 85) return "Votre parcours couvre l'essentiel de ce que cette formation attend.";
  if (score >= 65) return "Bon socle : quelques points à renforcer avant de candidater.";
  if (score >= 45) return "Candidature possible, mais des lacunes importantes restent à combler.";
  return "Écart important entre votre parcours et ce que cette formation attend.";
}

/**
 * Jusqu'à `limit` actions, par ordre d'utilité : d'abord rendre le score
 * fiable (sans cela, le reste n'a pas de sens), puis combler les lacunes, puis
 * avancer la candidature.
 */
export function buildNextSteps(
  profile: StudentProfile,
  formation: StudyProgram,
  result: CompatibilityResult,
  aid: DecisionAid,
  limit = 3,
): NextStep[] {
  const back = `/resultat?formationId=${formation.id}`;
  const profileStep2 = `/profil?etape=2&next=${encodeURIComponent(back)}`;
  const steps: NextStep[] = [];

  if (result.noContentMatch) {
    steps.push({
      title: "Vérifiez l'intitulé de vos matières",
      detail: "Un intitulé non reconnu ne compte pas. Importez votre relevé de notes ou corrigez vos matières.",
      href: profileStep2,
    });
  } else if (result.evidenceCapped) {
    const count = profileEvidenceCount(profile);
    steps.push({
      title: "Complétez votre profil",
      detail: `Seulement ${count} élément${count > 1 ? "s" : ""} reconnu${count > 1 ? "s" : ""} : importez votre relevé ou ajoutez au moins ${EVIDENCE_FULL_ITEMS} matières et compétences pour un score complet.`,
      href: profileStep2,
    });
  }

  if (!teachesInStudentLanguage(profile, formation)) {
    steps.push({
      title: `Justifiez votre niveau en ${formation.language}`,
      detail:
        "Un test de langue reconnu est souvent exigé : vérifiez lequel et le niveau demandé sur la page officielle. Si vous suivez des cours dans cette langue, ajoutez-la à votre profil.",
      href: `/profil?next=${encodeURIComponent(back)}`,
    });
  }

  // Le palier, pas l'ajustement : avec des résultats déclarés « bons », l'ajustement
  // peut valoir 0 alors que le jury d'une formation sélective lira les vraies notes.
  const tier = selectivityTier(selectivityOf(formation.id));
  if ((tier === "sélective" || tier === "très sélective") && !validTranscriptAverage(profile)) {
    steps.push({
      title: "Importez votre relevé de notes",
      detail: "Formation sélective : le jury regarde vos notes réelles. Importées, elles comptent dans ce score.",
      href: profileStep2,
    });
  }

  const language = normalize(formation.language);
  for (const action of aid.actions) {
    // La langue a déjà sa propre action (ci-dessus) : pas de doublon « Anglais courant ».
    if (!teachesInStudentLanguage(profile, formation) && normalize(action.label).includes(language)) continue;
    const weight = action.importance === "essentielle" ? "Essentiel pour cette formation" : action.importance === "importante" ? "Important pour cette formation" : "Un plus pour cette formation";
    steps.push({
      title: action.status === "manquant" ? `Montrez une preuve : « ${action.label} »` : `Renforcez « ${action.label} »`,
      detail:
        action.status === "manquant"
          ? `${weight}, absent de votre profil : un cours, un projet ou une certification qui le prouve.`
          : `${weight} : vous avez une base proche, approfondissez-la (cours, projet ou certification).`,
    });
  }

  if (result.overallScore >= 45 && !result.domainCapped && !result.noContentMatch) {
    if (!formation.demo) {
      steps.push({
        title: "Vérifiez les conditions officielles",
        detail: "Dates, pièces et modalités : la page de l'établissement fait foi.",
        href: formation.source,
        external: true,
      });
    }
    steps.push({
      title: "Préparez votre lettre de motivation",
      detail: "Un premier jet à partir de votre profil, que vous réécrivez avec vos mots.",
      href: `/lettre-motivation?formationId=${formation.id}`,
    });
  } else {
    steps.push({
      title: "Comparez avec des formations plus proches",
      detail: "Votre recherche classe tout le catalogue selon votre profil.",
      href: "/recherche",
    });
  }

  return steps.slice(0, Math.max(0, limit));
}
