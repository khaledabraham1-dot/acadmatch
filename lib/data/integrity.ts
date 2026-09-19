import type { Formation, VerificationStatus } from "@/types";

/**
 * Intégrité du catalogue (Étape 8).
 *
 * Ces helpers centralisent les règles "une donnée réelle ne doit jamais
 * ressembler à une démo" et la fraîcheur de vérification — utilisées par
 * les tests et, plus tard, par l'UI (badge "à revérifier").
 */

/** Au-delà de ce délai, une fiche vérifiée doit passer en "à revérifier". */
export const VERIFICATION_MAX_AGE_DAYS = 180;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isHttpsOfficialUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function daysSince(isoDate: string, now = new Date()): number | null {
  if (!isIsoDate(isoDate)) return null;
  const then = new Date(`${isoDate}T00:00:00.000Z`).getTime();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - then) / (24 * 60 * 60 * 1000));
}

export function isVerificationStale(verifiedAt: string, now = new Date()): boolean {
  const age = daysSince(verifiedAt, now);
  if (age === null) return true;
  return age > VERIFICATION_MAX_AGE_DAYS;
}

/**
 * Statut effectif d'une fiche : une donnée "vérifiée" trop ancienne doit être
 * traitée comme "à revérifier" même si le champ n'a pas encore été mis à jour.
 */
export function effectiveVerificationStatus(
  formation: Formation,
  now = new Date(),
): VerificationStatus | "démonstration" {
  if (formation.demo) return "démonstration";
  if (formation.verificationStatus === "à revérifier") return "à revérifier";
  if (isVerificationStale(formation.verifiedAt, now)) return "à revérifier";
  return "vérifiée";
}

export interface CatalogueIssue {
  formationId: string;
  message: string;
}

/** Règles dures d'intégrité du catalogue — aucune exception silencieuse. */
export function auditCatalogue(formations: Formation[], now = new Date()): CatalogueIssue[] {
  const issues: CatalogueIssue[] = [];
  const seenIds = new Set<string>();
  const seenSources = new Set<string>();

  for (const formation of formations) {
    if (seenIds.has(formation.id)) {
      issues.push({ formationId: formation.id, message: "id dupliqué" });
    }
    seenIds.add(formation.id);

    if (!formation.name.trim() || !formation.institution.trim() || !formation.city.trim()) {
      issues.push({ formationId: formation.id, message: "identité incomplète (nom / établissement / ville)" });
    }

    if (!formation.applicationProcedure.trim()) {
      issues.push({ formationId: formation.id, message: "procédure de candidature manquante" });
    }

    if (formation.coreCourses.length === 0 || formation.skills.length === 0) {
      issues.push({ formationId: formation.id, message: "contenu académique ou compétences vides" });
    }

    if (formation.prerequisites.length === 0) {
      issues.push({ formationId: formation.id, message: "aucun prérequis explicite" });
    }

    if (!isHttpsOfficialUrl(formation.source)) {
      issues.push({ formationId: formation.id, message: "source non HTTPS / URL invalide" });
    }

    if (formation.demo) {
      if (!formation.source.includes("demo.acadmatch.fr")) {
        issues.push({
          formationId: formation.id,
          message: "fiche démo : la source doit utiliser le domaine demo.acadmatch.fr",
        });
      }
      continue;
    }

    // Formation réelle
    if (formation.source.includes("demo.acadmatch.fr")) {
      issues.push({
        formationId: formation.id,
        message: "fiche réelle avec une URL de démonstration",
      });
    }

    if (!isIsoDate(formation.verifiedAt)) {
      issues.push({ formationId: formation.id, message: "verifiedAt invalide (YYYY-MM-DD attendu)" });
    }

    if (formation.verificationStatus !== "vérifiée" && formation.verificationStatus !== "à revérifier") {
      issues.push({ formationId: formation.id, message: "verificationStatus inconnu" });
    }

    if (seenSources.has(formation.source)) {
      issues.push({
        formationId: formation.id,
        message: `source déjà utilisée par une autre fiche (${formation.source})`,
      });
    }
    seenSources.add(formation.source);

    if (effectiveVerificationStatus(formation, now) === "à revérifier") {
      // Signal informatif : pas une erreur bloquante du build, mais tracé pour l'audit.
      issues.push({
        formationId: formation.id,
        message: `à revérifier (vérification trop ancienne ou statut explicite)`,
      });
    }
  }

  return issues;
}

/** Erreurs bloquantes uniquement (exclut le signal "à revérifier" de fraîcheur). */
export function blockingCatalogueIssues(formations: Formation[], now = new Date()): CatalogueIssue[] {
  return auditCatalogue(formations, now).filter(
    (issue) => !issue.message.startsWith("à revérifier"),
  );
}
