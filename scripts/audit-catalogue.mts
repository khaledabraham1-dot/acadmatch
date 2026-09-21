/**
 * Rapport d'intégrité du catalogue — expose `auditCatalogue` (déjà testé,
 * lib/data/integrity.ts) en outil consultable, pas seulement en assertion de
 * test. Sert à répondre à une seule question au fil de la croissance du
 * catalogue (plus de formations, plus de pays) : quelles fiches ont un
 * problème bloquant, et lesquelles doivent être revérifiées auprès de leur
 * source officielle ?
 *
 * Usage : npm run audit:catalogue
 * Complète scripts/audit_sources.py (qui vérifie que les URL sources
 * répondent en HTTP) — celui-ci vérifie la donnée elle-même (dates,
 * cohérence démo/réel, pays renseigné, etc.).
 */
import { FORMATIONS } from "../data/formations.ts";
import { auditCatalogue, blockingCatalogueIssues } from "../lib/data/integrity.ts";

const now = new Date();
const allIssues = auditCatalogue(FORMATIONS, now);
const blocking = blockingCatalogueIssues(FORMATIONS, now);
const staleOnly = allIssues.filter((issue) => issue.message.startsWith("à revérifier"));

console.log(`Catalogue audité : ${FORMATIONS.length} formations, ${now.toISOString().slice(0, 10)}\n`);

if (blocking.length > 0) {
  console.log(`❌ ${blocking.length} problème(s) BLOQUANT(S) :`);
  for (const issue of blocking) {
    console.log(`   - [${issue.formationId}] ${issue.message}`);
  }
  console.log("");
} else {
  console.log("✅ Aucun problème bloquant.\n");
}

if (staleOnly.length > 0) {
  console.log(`⚠️  ${staleOnly.length} fiche(s) à revérifier auprès de leur source officielle :`);
  for (const issue of staleOnly) {
    console.log(`   - [${issue.formationId}] ${issue.message}`);
  }
} else {
  console.log("Aucune fiche à revérifier pour le moment.");
}

// Code de sortie non-nul uniquement sur du bloquant : la staleness est un
// signal à traiter, pas un échec de build (voir blockingCatalogueIssues).
process.exit(blocking.length > 0 ? 1 : 0);
