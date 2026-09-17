import type {
  CompatibilityBreakdown,
  CompatibilityResult,
  Formation,
  Importance,
  StudentProfile,
} from "@/types";
import { ENGINE_WEIGHTS } from "@/lib/matching/engine";
import { getCompatibilityLabel } from "@/lib/matching/labels";
import { normalize } from "@/lib/utils";

/**
 * Aide à la décision (Étape 7) — générée par règles, sans IA.
 *
 * Objectif : transformer un score en message actionnable qu'un étudiant
 * comprend sans connaître le moteur. Chaque phrase est dérivée de données
 * déjà calculées (breakdown, matches, formation) pour rester auditable.
 */

const IMPORTANCE_RANK: Record<Importance, number> = {
  essentielle: 3,
  importante: 2,
  utile: 1,
};

const CRITERION_LABELS: Record<keyof CompatibilityBreakdown, string> = {
  prerequisites: "les prérequis d'admission",
  academicContent: "le contenu académique",
  skills: "les compétences attendues",
  levelDegree: "l'adéquation niveau / objectif",
};

export interface DecisionAction {
  /** Intitulé à renforcer (matière, compétence, prérequis…). */
  label: string;
  importance: Importance;
  /** Correspondance actuelle : manquant ou partiel. */
  status: "manquant" | "partielle";
  /** Conseil court, sans jargon. */
  advice: string;
}

export interface DecisionAid {
  /** Phrase d'accroche du verdict. */
  headline: string;
  /** 1 à 3 phrases d'explication. */
  paragraphs: string[];
  /** Critère le plus faible du breakdown (pour cibler l'effort). */
  weakestCriterion: keyof CompatibilityBreakdown;
  weakestCriterionLabel: string;
  /** Jusqu'à 3 actions prioritaires ordonnées par importance. */
  actions: DecisionAction[];
}

function importanceOf(formation: Formation, requirementName: string): Importance {
  const key = normalize(requirementName);
  const fromCourses = formation.coreCourses.find((item) => normalize(item.name) === key);
  if (fromCourses) return fromCourses.importance;
  const fromSkills = formation.skills.find((item) => normalize(item.name) === key);
  if (fromSkills) return fromSkills.importance;
  const fromPrereq = formation.prerequisites.find(
    (req) => normalize(req.value) === key || normalize(req.label) === key,
  );
  if (fromPrereq?.importance) return fromPrereq.importance;
  return "importante";
}

function adviceFor(label: string, importance: Importance, status: "manquant" | "partielle"): string {
  const priority =
    importance === "essentielle"
      ? "Priorité haute"
      : importance === "importante"
        ? "Priorité moyenne"
        : "Complément utile";

  if (status === "partielle") {
    return `${priority} : vous avez une base proche de « ${label} » — approfondissez-la (cours, projet ou certification) avant de candidater.`;
  }
  return `${priority} : « ${label} » n'apparaît pas dans votre profil. Ajoutez une preuve concrète (module, projet, stage) ou choisissez une formation moins exigeante sur ce point.`;
}

function weakestCriterionOf(breakdown: CompatibilityBreakdown): keyof CompatibilityBreakdown {
  const entries = Object.entries(breakdown) as [keyof CompatibilityBreakdown, number][];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

/** Construit le plan d'actions à partir des correspondances manquantes / partielles. */
export function buildActionPlan(
  formation: Formation,
  result: CompatibilityResult,
  limit = 3,
): DecisionAction[] {
  const candidates = result.matches
    .filter((row) => row.strength === "manquant" || row.strength === "partielle")
    .map((row) => {
      const importance = importanceOf(formation, row.formationRequirement);
      const status = row.strength as "manquant" | "partielle";
      return {
        label: row.formationRequirement,
        importance,
        status,
        advice: adviceFor(row.formationRequirement, importance, status),
        rank: IMPORTANCE_RANK[importance] * 10 + (status === "manquant" ? 2 : 1),
      };
    });

  candidates.sort((a, b) => b.rank - a.rank);

  const seen = new Set<string>();
  const actions: DecisionAction[] = [];
  for (const candidate of candidates) {
    const key = normalize(candidate.label);
    if (seen.has(key)) continue;
    seen.add(key);
    actions.push({
      label: candidate.label,
      importance: candidate.importance,
      status: candidate.status,
      advice: candidate.advice,
    });
    if (actions.length >= limit) break;
  }
  return actions;
}

/**
 * Produit l'aide à la décision complète pour une paire profil ↔ formation.
 * Fonction pure : testable indépendamment de l'UI.
 */
export function buildDecisionAid(
  profile: StudentProfile,
  formation: Formation,
  result: CompatibilityResult,
): DecisionAid {
  const label = getCompatibilityLabel(result.overallScore);
  const weakestCriterion = weakestCriterionOf(result.breakdown);
  const weakestScore = result.breakdown[weakestCriterion];
  const goalMatches = formation.goal === profile.goal;
  const languageOk = profile.languages.some(
    (lang) => normalize(lang) === normalize(formation.language),
  );

  const headline = `${label.label} (${result.overallScore}/100) avec « ${formation.name} ».`;

  const paragraphs: string[] = [];

  paragraphs.push(
    goalMatches
      ? `Cette formation correspond à votre objectif (${profile.goal}).`
      : `Attention : vous visez un « ${profile.goal} », alors que cette formation relève plutôt d'un objectif « ${formation.goal} ».`,
  );

  paragraphs.push(
    `Le point le plus fragile de votre dossier pour cette formation est ${CRITERION_LABELS[weakestCriterion]} (${weakestScore}/100).`,
  );

  if (!languageOk) {
    paragraphs.push(
      `La formation est enseignée en ${formation.language}, langue que vous n'avez pas indiquée comme confortable — cela pèse sur les prérequis.`,
    );
  }

  if (result.strengths.length > 0) {
    paragraphs.push(
      `Vos atouts les plus nets ici : ${result.strengths.slice(0, 3).join(", ")}.`,
    );
  }

  // Rappel transparent des poids (explicabilité) — toujours en dernier.
  paragraphs.push(
    `Le score combine prérequis (${Math.round(ENGINE_WEIGHTS.prerequisites * 100)} %), contenu (${Math.round(ENGINE_WEIGHTS.academicContent * 100)} %), compétences (${Math.round(ENGINE_WEIGHTS.skills * 100)} %) et niveau/objectif (${Math.round(ENGINE_WEIGHTS.levelDegree * 100)} %). Ce n'est pas une probabilité d'admission.`,
  );

  return {
    headline,
    paragraphs,
    weakestCriterion,
    weakestCriterionLabel: CRITERION_LABELS[weakestCriterion],
    actions: buildActionPlan(formation, result),
  };
}
