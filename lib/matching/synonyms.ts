import { normalize } from "@/lib/utils";

/**
 * Groupes de termes considérés comme équivalents par le moteur de matching.
 *
 * Objectif : reconnaître qu'un étudiant qui a suivi "Apprentissage automatique"
 * répond à une exigence "Machine Learning", sans dépendre d'une IA externe.
 * C'est volontairement une liste courte et lisible plutôt qu'un modèle de
 * langage : on peut l'étendre au fil du temps ou la remplacer plus tard par
 * un moteur plus avancé (voir lib/matching/engine.ts).
 *
 * N'y mettre que de VRAIES équivalences. Deux groupes du MVP (toutes les
 * matières de droit entre elles ; relations internationales = institutions
 * politiques = méthodologie de recherche) ont été retirés le 2026-09-27 :
 * sans effet tant que le catalogue était informatique, ils gonflaient les
 * scores une fois les domaines Droit et Sciences politiques ouverts
 * ("Droit international" comptait comme "Droit des sociétés"). Les
 * équivalences propres à une formation passent par les `aliases` de sa fiche.
 */
const SYNONYM_GROUPS: string[][] = [
  ["python", "programmation python"],
  ["machine learning", "apprentissage automatique", "ml"],
  [
    "statistiques",
    "biostatistiques",
    "statistiques economiques",
    "probabilites et statistiques",
    "probabilites",
    "statistics",
    "statistical methods",
    "probability",
  ],
  ["bases de donnees", "sql", "bases de donnees medicales", "database", "database systems"],
  ["algorithmique", "algorithmique avancee", "structures de donnees"],
  ["programmation orientee objet", "poo"],
  ["reseaux de neurones", "deep learning"],
  ["traitement du langage naturel", "nlp"],
  ["mathematiques appliquees", "mathematiques pour l'ia", "algebre lineaire", "mathematiques"],
  ["anglais courant", "anglais juridique", "anglais scientifique", "anglais technique", "anglais"],
  ["gestion de projet", "conduite de projet"],
  ["analyse de donnees", "econometrie"],
  ["redaction juridique", "redaction academique", "argumentation"],
  ["programmation r", "r"],
  ["git", "devops", "tests logiciels"],
  ["marketing", "marketing digital"],
  ["systemes d'information", "transformation digitale"],
  ["reseaux informatiques", "systemes d'exploitation"],
  ["rigueur scientifique", "rigueur mathematique"],
];

const NORMALIZED_GROUPS = SYNONYM_GROUPS.map((group) => group.map(normalize));

/** Retourne l'index du groupe de synonymes contenant `term`, ou -1. */
export function synonymGroupOf(term: string): number {
  const value = normalize(term);
  return NORMALIZED_GROUPS.findIndex((group) => group.includes(value));
}

/** Deux termes appartiennent-ils au même groupe de synonymes ? */
export function areSynonyms(a: string, b: string): boolean {
  const groupA = synonymGroupOf(a);
  if (groupA === -1) return false;
  return groupA === synonymGroupOf(b);
}
