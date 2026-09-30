import { normalize } from "@/lib/utils";

/**
 * Forme canonique d'un intitulé de cours, pour la COMPARAISON uniquement
 * (l'intitulé affiché ne change jamais). Audit du 2026-09-30 : les relevés
 * réels nomment les mêmes cours très différemment selon l'université et le
 * pays — « Analyse II », « Algo S3 », « BDD », « INF301 - Génie logiciel »,
 * « Operating Systems » — et un étudiant ne doit pas être pénalisé pour cela.
 *
 * Trois transformations, dans l'ordre :
 * 1. numérotation retirée : niveau ou semestre en fin d'intitulé (1, 2, II,
 *    S3, « partie 2 », « (1) »), code de cours en tête (« INF301 - »). Un
 *    chiffre qui fait partie du nom est gardé (« Web 2.0 », « Industrie 4.0 »,
 *    « 3D ») : seuls les numéros isolés en fin d'intitulé sont retirés.
 * 2. abréviations courantes développées (mot entier seulement).
 * 3. intitulés anglais usuels traduits (expression entière seulement).
 * Aucune de ces tables ne rapproche deux sujets différents : n'y ajouter
 * que des équivalences exactes.
 */

const ABBREVIATIONS: Record<string, string> = {
  bdd: "bases de donnees",
  sgbd: "bases de donnees",
  algo: "algorithmique",
  prog: "programmation",
  poo: "programmation orientee objet",
  ro: "recherche operationnelle",
  ia: "intelligence artificielle",
  ml: "machine learning",
  maths: "mathematiques",
  math: "mathematiques",
  stats: "statistiques",
  stat: "statistiques",
  proba: "probabilites",
  probas: "probabilites",
  compta: "comptabilite",
  rdm: "resistance des materiaux",
  thermo: "thermodynamique",
  meca: "mecanique",
  elec: "electronique",
  info: "informatique",
  orga: "organique",
  inorga: "inorganique",
  dev: "developpement",
  archi: "architecture",
  eco: "economie",
};

/** Expressions anglaises courantes → intitulé français équivalent (normalisés, sans accents). */
const ENGLISH_TITLES: [string, string][] = [
  ["database systems", "bases de donnees"],
  ["databases", "bases de donnees"],
  ["database", "bases de donnees"],
  ["operating systems", "systemes d'exploitation"],
  ["data structures and algorithms", "algorithmique et structures de donnees"],
  ["data structures", "structures de donnees"],
  ["algorithm design", "algorithmique"],
  ["algorithms", "algorithmique"],
  ["object oriented programming", "programmation orientee objet"],
  ["object-oriented programming", "programmation orientee objet"],
  ["computer architecture", "architecture des ordinateurs"],
  ["computer networks", "reseaux informatiques"],
  ["computer networking", "reseaux informatiques"],
  ["software engineering", "genie logiciel"],
  ["artificial intelligence", "intelligence artificielle"],
  ["computer vision", "vision par ordinateur"],
  ["data mining", "fouille de donnees"],
  ["data analysis", "analyse de donnees"],
  ["web development", "programmation web"],
  ["compilers", "compilation"],
  ["discrete mathematics", "mathematiques discretes"],
  ["linear algebra", "algebre lineaire"],
  ["numerical analysis", "analyse numerique"],
  ["numerical methods", "methodes numeriques"],
  ["real analysis", "analyse reelle"],
  ["complex analysis", "analyse complexe"],
  ["calculus", "analyse"],
  ["probability theory", "probabilites"],
  ["probability", "probabilites"],
  ["statistics", "statistiques"],
  ["optimization", "optimisation"],
  ["microeconomics", "microeconomie"],
  ["macroeconomics", "macroeconomie"],
  ["econometrics", "econometrie"],
  ["financial accounting", "comptabilite generale"],
  ["accounting", "comptabilite"],
  ["corporate finance", "finance d'entreprise"],
  ["constitutional law", "droit constitutionnel"],
  ["contract law", "droit des contrats"],
  ["civil law", "droit civil"],
  ["criminal law", "droit penal"],
  ["administrative law", "droit administratif"],
  ["company law", "droit des societes"],
  ["corporate law", "droit des societes"],
  ["european union law", "droit de l'union europeenne"],
  ["eu law", "droit de l'union europeenne"],
  ["public international law", "droit international public"],
  ["private international law", "droit international prive"],
  ["political science", "science politique"],
  ["international relations", "relations internationales"],
  ["public policy", "politiques publiques"],
  ["sociology", "sociologie"],
  ["cell biology", "biologie cellulaire"],
  ["molecular biology", "biologie moleculaire"],
  ["genetics", "genetique"],
  ["biochemistry", "biochimie"],
  ["microbiology", "microbiologie"],
  ["physiology", "physiologie"],
  ["immunology", "immunologie"],
  ["organic chemistry", "chimie organique"],
  ["inorganic chemistry", "chimie inorganique"],
  ["analytical chemistry", "chimie analytique"],
  ["physical chemistry", "chimie physique"],
  ["quantum mechanics", "mecanique quantique"],
  ["classical mechanics", "mecanique classique"],
  ["fluid mechanics", "mecanique des fluides"],
  ["thermodynamics", "thermodynamique"],
  ["electromagnetism", "electromagnetisme"],
  ["electronics", "electronique"],
  ["signal processing", "traitement du signal"],
  ["control theory", "automatique"],
  ["automatic control", "automatique"],
  ["strength of materials", "resistance des materiaux"],
  ["programming", "programmation"],
].sort((a, b) => b[0].length - a[0].length) as [string, string][];

// Un numéro n'est retiré que s'il est séparé du reste (espace, tiret, deux-points,
// parenthèse) : « Web 2.0 » garde son « 2.0 », « Probabilités 3 » garde son « s ».
const TRAILING_NUMBERING =
  /(?:(?:\s+|\s*[-–:]\s*|\s*(?=\())\(?\s*(?:(?:semestre|partie|niveau|part|level)\s*\d{1,2}|s\d{1,2}|\d{1,2}|i{1,3}|iv|vi{0,3}|ix|x)\s*\)?(?:\s*(?:et|&|-|\/)\s*(?:\d{1,2}|i{1,3}|iv|vi{0,3}|ix|x))*)+$/;
/** Code de cours en tête : « INF301 - », « M1102 : », « UE 3.2 — ». */
const LEADING_CODE = /^(?:ue\s*)?[a-z]{0,5}\s?\d{2,5}[a-z]?\s*[-–:.]\s*/;

const cache = new Map<string, string>();

export function canonicalTitle(label: string): string {
  const cached = cache.get(label);
  if (cached !== undefined) return cached;

  let value = normalize(label).replace(/[’`]/g, "'");
  value = value.replace(LEADING_CODE, "");
  // Plusieurs passes : « Analyse II (S3) » → « analyse ».
  for (let i = 0; i < 3; i++) {
    const stripped = value.replace(TRAILING_NUMBERING, "").trim();
    if (stripped === value || !stripped) break;
    value = stripped;
  }
  for (const [english, french] of ENGLISH_TITLES) {
    value = value.replace(new RegExp(`(^|[^a-z])${escape(english)}(?=$|[^a-z])`, "g"), `$1${french}`);
  }
  value = value
    .split(/(\s+)/)
    .map((part) => ABBREVIATIONS[part] ?? part)
    .join("")
    .trim();

  cache.set(label, value);
  return value;
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
