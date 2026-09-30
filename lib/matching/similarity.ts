import type { MatchStrength } from "@/types";
import { canonicalTitle } from "@/lib/matching/titleVariants";
import { areSynonyms } from "@/lib/matching/synonyms";

/**
 * Similarité entre intitulés (matières, compétences), partagée par le moteur
 * de score (engine.ts) et le vocabulaire reconnu (vocabulary.ts) : une seule
 * définition de « ces deux libellés parlent de la même chose ».
 */

const STOPWORDS = new Set([
  "de", "des", "du", "la", "le", "les", "et", "en", "pour", "l", "d", "aux",
  "au", "a", "une", "un", "ou", "sur", "avec",
]);

/** Singulier et pluriel confondus (« réseau » / « réseaux », « politique » / « politiques »). */
function singular(token: string): string {
  return token.length > 3 && /[sx]$/.test(token) ? token.slice(0, -1) : token;
}

function tokenize(value: string): string[] {
  return canonicalTitle(value)
    .split(/[^a-z0-9]+/)
    // Un chiffre isolé compte (« Web 2.0 » ≠ « Web 3.0 ») ; une lettre seule non
    // (« R » ne doit pas matcher par hasard, voir similarity ci-dessous).
    .filter((token) => (token.length > 1 || /\d/.test(token)) && !STOPWORDS.has(token))
    .map(singular);
}

/** Similarité entre deux libellés, de 0 (aucun rapport) à 1 (équivalents). */
export function similarity(a: string, b: string): number {
  // Formes canoniques : numérotation, abréviations et intitulés anglais ramenés
  // à l'intitulé français (lib/matching/titleVariants.ts).
  const na = canonicalTitle(a);
  const nb = canonicalTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (areSynonyms(na, nb)) return 0.9;

  // Comparaison MOT à mot (jamais caractère à caractère) à partir d'ici :
  // un test `na.includes(nb)` sur les chaînes brutes ferait matcher "R" dans
  // "droit" ou "Git" dans "digitale", par pur hasard de lettres. `tokenize`
  // filtre déjà les mots d'une seule lettre, donc un intitulé comme "R" tombe
  // ici à un ensemble de mots vide et ne matche plus jamais accidentellement.
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const setA = new Set(ta);
  const setB = new Set(tb);
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;
  const jaccard = union === 0 ? 0 : intersection / union;

  // Un intitulé entièrement contenu, mot pour mot, dans un intitulé plus
  // long est un signal positif : soit une reformulation plus détaillée
  // ("Bases de données" ⊆ "Bases de données médicales"), soit une
  // spécialisation du même thème ("Droit" ⊆ "Droit des sociétés"). On ne
  // le traite comme une correspondance FORTE que si au moins deux mots sont
  // partagés : un seul mot générique en commun ("Analyse" ⊆ "Analyse
  // financière") est un signal réel mais plus faible — la matière commune
  // peut recouvrir des domaines différents — d'où une correspondance
  // partielle plutôt que forte.
  const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  const isFullyContained = smaller.size > 0 && [...smaller].every((token) => larger.has(token));
  if (isFullyContained) {
    return smaller.size >= 2 ? 0.8 : Math.max(jaccard, 0.5);
  }

  return jaccard;
}

export function strengthFromScore(score: number): MatchStrength {
  if (score >= 0.6) return "forte";
  if (score >= 0.25) return "partielle";
  return "manquant";
}
