import { FORMATIONS } from "@/data/formations";
import { SUGGESTED_COURSES, SUGGESTED_SKILLS } from "@/data/subjects";
import { COMMON_COURSE_TITLES } from "@/data/academicVocabulary";
import { catalogueVocabulary } from "@/lib/profile/suggestions";
import { similarity } from "@/lib/matching/similarity";
import { synonymTerms } from "@/lib/matching/synonyms";
import { normalize } from "@/lib/utils";

/**
 * Vocabulaire académique reconnu par AcadMatch (audit du 2026-09-30).
 *
 * Une matière ou une compétence ne compte comme PREUVE que si elle
 * ressemble à une vraie matière connue : celles des fiches du catalogue
 * (programmes, compétences, prérequis, alias), les suggestions par domaine
 * et les synonymes. Cas constaté : « Chat, Chien, Lion » en matières et
 * « Girafe, Zèbre » en compétences donnaient 51/100, parce que le plafond de
 * preuve comptait les mots saisis sans vérifier qu'ils voulaient dire
 * quelque chose.
 *
 * La reconnaissance utilise la même similarité que le score
 * (lib/matching/similarity.ts) : un libellé reconnu ici est un libellé que le
 * moteur sait rapprocher d'une vraie exigence. Un intitulé réel absent de ce
 * vocabulaire n'est pas refusé : il est signalé à l'étudiant et ne compte
 * simplement pas comme preuve.
 */
/**
 * Outils et savoir-faire académiques courants, absents des fiches mais bien
 * réels : sans eux, un étudiant qui écrit « Linux », « Stata » ou « PCR »
 * serait signalé à tort. Reconnus comme preuves ; sans effet sur le score
 * d'une formation qui ne les exige pas.
 */
const GENERAL_ACADEMIC_TERMS = [
  "Linux", "Unix", "Excel", "PowerPoint", "LaTeX", "Matlab", "Scilab", "Octave",
  "Stata", "SPSS", "SAS", "EViews", "Power BI", "C", "C++", "C#", "JavaScript", "TypeScript",
  "HTML", "CSS", "PHP", "Kotlin", "Swift", "Rust", "Scala", "Julia", "Bash", "Docker", "Kubernetes",
  "Spark", "Hadoop", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Jupyter", "AutoCAD", "SolidWorks",
  "CATIA", "Arduino", "Raspberry Pi", "PCR", "Western blot", "Culture cellulaire", "Microscopie",
  "Chromatographie", "Spectrométrie de masse", "Bioinformatique", "Zotero", "Recherche documentaire",
  "Travail en équipe", "Prise de parole en public", "Rédaction scientifique", "Esprit critique",
];

const KNOWN_TERMS: string[] = [
  ...new Set(
    [
      ...catalogueVocabulary(FORMATIONS, "matiere"),
      ...catalogueVocabulary(FORMATIONS, "competence"),
      ...Object.values(SUGGESTED_COURSES).flat(),
      ...Object.values(SUGGESTED_SKILLS).flat(),
      ...synonymTerms(),
      ...GENERAL_ACADEMIC_TERMS,
      ...Object.values(COMMON_COURSE_TITLES).flat(),
    ]
      .map(normalize)
      .filter(Boolean),
  ),
];
const KNOWN_SET = new Set(KNOWN_TERMS);

/**
 * Seuil de reconnaissance, plus strict que celui du score : un seul mot en
 * commun (« Jeux vidéo » / « Théorie des jeux ») ne suffit pas à faire d'un
 * libellé une matière reconnue. 0,5 = libellé entièrement contenu dans un
 * terme connu, ou recouvrement d'au moins la moitié des mots.
 */
const RECOGNITION_THRESHOLD = 0.5;

const cache = new Map<string, boolean>();

/** Le libellé ressemble-t-il (au moins partiellement) à une matière ou compétence connue ? */
export function isRecognizedTerm(label: string): boolean {
  const key = normalize(label);
  if (!key) return false;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const recognized = KNOWN_SET.has(key) || KNOWN_TERMS.some((term) => similarity(term, key) >= RECOGNITION_THRESHOLD);
  cache.set(key, recognized);
  return recognized;
}

/** Libellés non reconnus d'une liste (pour les signaler à l'étudiant). */
export function unrecognizedTerms(labels: string[]): string[] {
  return labels.filter((label) => !isRecognizedTerm(label));
}

/**
 * Une langue n'est pas une preuve académique : la déclarer (« Anglais »,
 * « Arabe courant ») ne dit rien du parcours. Elle reste utilisée pour les
 * exigences de langue, jamais pour lever un plafond de preuve.
 */
const LANGUAGE_WORDS = /^(anglais|francais|arabe|espagnol|allemand|italien|portugais|chinois|russe|turc|neerlandais|english|french)(\s|$)/;

export function isLanguageTerm(label: string): boolean {
  return LANGUAGE_WORDS.test(normalize(label));
}
