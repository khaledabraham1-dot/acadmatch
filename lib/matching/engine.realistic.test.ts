import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { acceptsStudentDomain, computeCompatibility, evidenceCap, EVIDENCE_FULL_ITEMS, profileEvidenceCount } from "@/lib/matching/engine";
import { compareFormationsByGoalThenScore } from "@/lib/matching/ranking";
import type { StudentProfile } from "@/types";

/**
 * Validation du moteur sur des profils étudiants réalistes et le vrai
 * catalogue (Étape 4 du roadmap). Contrairement à lib/matching/engine.test.ts
 * (règles unitaires sur des données synthétiques), ces tests documentent le
 * comportement attendu sur des cas concrets rencontrés en testant
 * manuellement le moteur — voir la mémoire projet "acadmatch-roadmap".
 */

describe("moteur de matching sur le catalogue réel — profils réalistes", () => {
  it("un étudiant en L3 Informatique visant un Master ne voit plus une Licence ressortir devant les Masters pertinents", () => {
    // Cas observé en testant l'Étape 4 : une Licence L1, largement dépassée
    // par le profil, obtenait un meilleur score brut qu'un vrai Master
    // pertinent (voir compareFormationsByGoalThenScore). On vérifie ici le
    // comportement de bout en bout, sur les vraies formations.
    const profile: StudentProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Informatique",
      currentDegree: "Licence Informatique",
      courses: [
        { id: "1", name: "Algorithmique" },
        { id: "2", name: "Bases de données" },
        { id: "3", name: "Programmation orientée objet" },
        { id: "4", name: "Probabilités" },
        { id: "5", name: "Statistiques" },
      ],
      skills: ["Python", "SQL", "Machine Learning"],
      goal: "Master",
      languages: ["Français", "Anglais"],
    };

    const scores = new Map(FORMATIONS.map((f) => [f.id, computeCompatibility(profile, f).overallScore]));
    const sorted = [...FORMATIONS].sort((a, b) =>
      compareFormationsByGoalThenScore(a, b, profile, (f) => scores.get(f.id) ?? -1),
    );

    const firstNonMasterIndex = sorted.findIndex((f) => f.goal !== "Master");
    const lastMasterIndex = sorted.map((f) => f.goal).lastIndexOf("Master");
    expect(firstNonMasterIndex).toBeGreaterThan(lastMasterIndex);
  });

  it("pénalise mesurablement CHAQUE formation anglophone du catalogue quand l'étudiant n'est pas à l'aise en anglais", () => {
    // Généralisé (Phase 7, audit Matching V2) : ne teste plus une seule
    // formation codée en dur, mais toutes celles réellement enseignées en
    // anglais dans le catalogue — au moment de l'écriture : M2DS, MSc AI
    // CentraleSupélec, MoSIG (Grenoble) et UCLouvain (Belgique, 1er cas
    // international). Garde-fou plus solide : si un futur ajout anglophone
    // contourne accidentellement la vérification implicite de langue
    // (computeLanguageStrength, lib/matching/engine.ts), ce test le détecte
    // sans avoir à se souvenir d'ajouter un cas dédié.
    const englishFormations = FORMATIONS.filter((f) => f.language === "Anglais");
    expect(englishFormations.length).toBeGreaterThanOrEqual(4);

    const base: Omit<StudentProfile, "languages"> = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Mathématiques",
      currentDegree: "Licence Mathématiques",
      courses: [
        { id: "1", name: "Analyse" },
        { id: "2", name: "Algèbre linéaire" },
        { id: "3", name: "Probabilités" },
        { id: "4", name: "Statistiques" },
      ],
      skills: ["Rigueur mathématique", "Python"],
      goal: "Master",
    };

    for (const formation of englishFormations) {
      const comfortable = computeCompatibility({ ...base, languages: ["Français", "Anglais"] }, formation);
      const uncomfortable = computeCompatibility({ ...base, languages: ["Français"] }, formation);
      expect(uncomfortable.overallScore, `formation ${formation.id}`).toBeLessThan(comfortable.overallScore);
    }
  });

  it("un étudiant BUT2 visant une admission parallèle (objectif École spécialisée) voit les formations « École spécialisée » devant les Licences", () => {
    // Depuis la phase 4 (extension du catalogue), l'INSA Lyon n'est plus la
    // seule formation à objectif "École spécialisée" (ENSEIRB-MATMECA,
    // Bordeaux INP, a le même objectif) : on ne verrouille donc plus un
    // gagnant précis entre les deux — leur ordre reflète des différences
    // réelles de fiches (ex: "Programmation orientée objet" pondérée
    // différemment) — seulement l'invariant qui compte : aucune Licence ne
    // doit passer devant une formation visant réellement son objectif.
    const profile: StudentProfile = {
      currentLevel: "Licence 2",
      fieldOfStudy: "Informatique",
      currentDegree: "BUT Informatique (2e année)",
      courses: [
        { id: "1", name: "Programmation orientée objet" },
        { id: "2", name: "Bases de données" },
        { id: "3", name: "Réseaux informatiques" },
      ],
      skills: ["Java", "SQL"],
      goal: "École spécialisée",
      languages: ["Français"],
    };

    const scores = new Map(FORMATIONS.map((f) => [f.id, computeCompatibility(profile, f).overallScore]));
    const sorted = [...FORMATIONS].sort((a, b) =>
      compareFormationsByGoalThenScore(a, b, profile, (f) => scores.get(f.id) ?? -1),
    );

    const firstNonSpecialiseIndex = sorted.findIndex((f) => f.goal !== "École spécialisée");
    const lastSpecialiseIndex = sorted.map((f) => f.goal).lastIndexOf("École spécialisée");
    expect(firstNonSpecialiseIndex).toBeGreaterThan(lastSpecialiseIndex);
  });
});

describe("plafond hors domaine — catalogue multi-domaines", () => {
  const mechanics: StudentProfile = {
    currentLevel: "Licence 3",
    fieldOfStudy: "Sciences de l'ingénieur",
    currentDegree: "Licence Mécanique",
    courses: [
      { id: "1", name: "Mécanique" },
      { id: "2", name: "Mécanique des fluides" },
      { id: "3", name: "Thermodynamique" },
    ],
    skills: ["CAO"],
    goal: "Master",
    languages: ["Français", "Anglais"],
  };

  it("un étudiant en mécanique ne voit AUCUN master d'un autre domaine en « Partiellement compatible » ou mieux", () => {
    // Cas observé le 2026-09-27 : Master Droit européen (Strasbourg) à 47/100
    // pour un profil de mécanique — le niveau et la langue suffisaient à
    // franchir le seuil de 45, et "Sciences de l'ingénieur" ressemblait à
    // "Sciences politiques" par le seul mot "Sciences".
    // Sont exclues les formations qui déclarent ACCEPTER ce domaine (valeur ou
    // alias d'un prérequis "domaine", ex: master de physique ouvert aux élèves
    // ingénieurs) : pour elles, un bon score est légitime et sourcé.
    const acceptsEngineering = (f: (typeof FORMATIONS)[number]) =>
      f.prerequisites.some(
        (r) => r.type === "domaine" && [r.value, ...(r.aliases ?? [])].includes("Sciences de l'ingénieur"),
      );
    const outsideDomain = FORMATIONS.filter((f) => f.goal === "Master" && !acceptsEngineering(f));
    expect(outsideDomain.length).toBeGreaterThanOrEqual(15);
    for (const formation of outsideDomain) {
      const result = computeCompatibility(mechanics, formation);
      expect(result.overallScore, formation.id).toBeLessThan(45);
    }
  });

  it("le plafond est signalé et expliqué, jamais appliqué en silence", async () => {
    const { buildDecisionAid } = await import("@/lib/matching/explanation");
    const formation = FORMATIONS.find((f) => f.id === "f-master-droit-europeen-strasbourg")!;
    const result = computeCompatibility(mechanics, formation);
    expect(result.domainCapped).toBe(true);
    const aid = buildDecisionAid(mechanics, formation, result);
    expect(aid.paragraphs.some((p) => p.includes("score est volontairement limité"))).toBe(true);
  });

  it("une réorientation voisine ou déclarée n'est pas plafonnée (Informatique → Data Science, Droit → gestion UCLouvain)", () => {
    const info: StudentProfile = {
      ...mechanics,
      fieldOfStudy: "Informatique",
      courses: [
        { id: "1", name: "Algorithmique" },
        { id: "2", name: "Bases de données" },
        { id: "3", name: "Machine Learning" },
      ],
      skills: ["Python"],
    };
    const date = FORMATIONS.find((f) => f.id === "f-date-uclouvain")!;
    expect(computeCompatibility(info, date).domainCapped).toBeUndefined();

    const law: StudentProfile = { ...mechanics, fieldOfStudy: "Droit", courses: [{ id: "1", name: "Droit civil" }], skills: [] };
    const management = FORMATIONS.find((f) => f.id === "f-master-gestion-uclouvain")!;
    expect(computeCompatibility(law, management).domainCapped).toBeUndefined();
  });

  it("hors domaine, le plafond reste souple : l'ordre entre profils différents est préservé", () => {
    const formation = FORMATIONS.find((f) => f.id === "f-llm-international-economic-law-toulouse")!;
    const fluent = computeCompatibility(mechanics, formation);
    const notFluent = computeCompatibility({ ...mechanics, languages: ["Français"] }, formation);
    expect(fluent.domainCapped).toBe(true);
    expect(notFluent.overallScore).toBeLessThan(fluent.overallScore);
  });
});

describe("synonymes et preuve de contenu — domaines Droit / Sciences politiques", () => {
  it("un politiste ne ressort plus « compatible » sur un master de droit des affaires qui exige une licence de droit", () => {
    // Cas observé le 2026-09-27 : 86/100, car la table de synonymes du MVP
    // rendait "Droit international" équivalent à "Droit des sociétés".
    const politist: StudentProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Sciences politiques",
      currentDegree: "Licence Science politique",
      courses: [
        { id: "1", name: "Relations internationales" },
        { id: "2", name: "Géopolitique" },
        { id: "3", name: "Droit international" },
        { id: "4", name: "Diplomatie" },
      ],
      skills: ["Anglais courant", "Argumentation"],
      goal: "Master",
      languages: ["Français", "Anglais"],
    };
    const businessLaw = FORMATIONS.find((f) => f.id === "f-master-droit-affaires-amu")!;
    expect(computeCompatibility(politist, businessLaw).overallScore).toBeLessThan(45);

    const lawyer: StudentProfile = {
      ...politist,
      fieldOfStudy: "Droit",
      courses: [
        { id: "1", name: "Droit civil" },
        { id: "2", name: "Droit des contrats" },
        { id: "3", name: "Droit des sociétés" },
        // 5e preuve : « Anglais courant » est une langue, pas une preuve (vocabulary.ts).
        { id: "4", name: "Droit commercial" },
      ],
    };
    expect(computeCompatibility(lawyer, businessLaw).overallScore).toBeGreaterThanOrEqual(85);
  });
});

describe("séparation Physique / Chimie (ex-« Sciences fondamentales »)", () => {
  const chemist: StudentProfile = {
    currentLevel: "Licence 3",
    fieldOfStudy: "Chimie",
    currentDegree: "Licence de Chimie",
    courses: [
      { id: "1", name: "Chimie organique" },
      { id: "2", name: "Chimie inorganique" },
      { id: "3", name: "Spectroscopie" },
    ],
    // Deux compétences : profil « solide » (5 preuves), pour que ce test mesure
    // la séparation des domaines et non le plafond de preuve (engine.ts).
    skills: ["Expérimentation", "Rédaction scientifique"],
    goal: "Master",
    languages: ["Français", "Anglais"],
  };
  const icfp = () => FORMATIONS.find((f) => f.id === "f-master-icfp-psl")!;
  const chemistryMaster = () => FORMATIONS.find((f) => f.id === "f-master-chimie-strasbourg")!;

  it("un chimiste n'est plus aligné sur le master de physique fondamentale (était 64/100)", () => {
    expect(computeCompatibility(chemist, icfp()).overallScore).toBeLessThan(45);
    expect(computeCompatibility(chemist, chemistryMaster()).overallScore).toBeGreaterThanOrEqual(85);
  });

  it("un profil enregistré avec l'ancien domaine n'est pas plafonné à tort, ni en physique ni en chimie", () => {
    const legacy = { ...chemist, fieldOfStudy: "Sciences fondamentales" };
    expect(computeCompatibility(legacy, chemistryMaster()).domainCapped).toBeUndefined();
    expect(computeCompatibility(legacy, icfp()).domainCapped).toBeUndefined();
  });

  it("plus aucune fiche ne référence l'ancien domaine", () => {
    for (const formation of FORMATIONS) {
      expect(formation.field).not.toBe("Sciences fondamentales");
      for (const r of formation.prerequisites) {
        expect([r.value, ...(r.aliases ?? [])]).not.toContain("Sciences fondamentales");
      }
    }
  });
});

describe("compétences attendues à l'entrée, tirées des pages officielles (2026-09-28)", () => {
  it("un L3 informatique qui a exactement ce que MoSIG exige (C/Java, algorithmique, systèmes, bases de données) voit MoSIG en tête des masters", () => {
    const profile: StudentProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Informatique",
      currentDegree: "Licence Informatique",
      courses: [
        { id: "1", name: "Algorithmique" },
        { id: "2", name: "Bases de données" },
        { id: "3", name: "Systèmes d'exploitation" },
        { id: "4", name: "Architecture des ordinateurs" },
        { id: "5", name: "Probabilités" },
      ],
      skills: ["Java", "C"],
      goal: "Master",
      languages: ["Français", "Anglais"],
    };
    const masters = FORMATIONS.filter((f) => f.goal === "Master")
      .map((f) => ({ id: f.id, score: computeCompatibility(profile, f).overallScore }))
      .sort((a, b) => b.score - a.score);
    expect(masters[0].id).toBe("f-mosig-grenoble-inp");
  });

  it("le master de bio-informatique de Bordeaux, sans prérequis en informatique, ne pénalise pas un biologiste qui ne code pas", () => {
    const biologist: StudentProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Biologie & Santé",
      currentDegree: "Licence Sciences de la vie",
      courses: [
        { id: "1", name: "Biologie moléculaire" },
        { id: "2", name: "Génétique" },
        { id: "3", name: "Biostatistiques" },
        // Profil « solide » (5 preuves) même sans Python : sinon ajouter Python
        // relèverait seulement le plafond de preuve, pas l'adéquation.
        { id: "4", name: "Biochimie" },
        { id: "5", name: "Microbiologie" },
      ],
      skills: [],
      goal: "Master",
      languages: ["Français"],
    };
    const bioinfo = FORMATIONS.find((f) => f.id === "f-master-bioinformatique-bordeaux")!;
    const withPython = computeCompatibility({ ...biologist, skills: ["Python"] }, bioinfo);
    const withoutPython = computeCompatibility(biologist, bioinfo);
    expect(withoutPython.overallScore).toBe(withPython.overallScore);
    expect(withoutPython.gaps).not.toContain("Python");
  });
});

describe("niveau de preuve (audit du 2026-09-30)", () => {
  const thinM1: StudentProfile = {
    currentLevel: "Master 1",
    fieldOfStudy: "Data Science & IA",
    currentDegree: "Licence en Informatique",
    courses: [{ id: "1", name: "Machine Learning" }],
    skills: ["Python"],
    goal: "Master",
    languages: ["Français", "Anglais"],
    academicStanding: "Bons résultats",
  };
  const mscAi = () => FORMATIONS.find((f) => f.id === "f-msc-ai-centralesupelec")!;

  it("un M1 qui ne déclare qu'une matière et une compétence n'obtient plus 84/100 sur une MSc en IA", () => {
    const result = computeCompatibility(thinM1, mscAi());
    expect(result.evidenceCapped).toBe(true);
    expect(result.overallScore).toBeLessThan(65);
  });

  it("chaque preuve ajoutée relève le plafond, jamais l'inverse", () => {
    let previous = -1;
    for (let n = 0; n <= EVIDENCE_FULL_ITEMS; n++) {
      const cap = evidenceCap(n);
      const value = cap ?? 101;
      expect(value).toBeGreaterThan(previous);
      previous = value;
    }
    expect(evidenceCap(EVIDENCE_FULL_ITEMS)).toBeNull();
  });

  it("un profil qui suit nos recommandations (3 matières, 2 compétences) n'est jamais plafonné", () => {
    const solid = {
      ...thinM1,
      courses: [
        { id: "1", name: "Machine Learning" },
        { id: "2", name: "Statistiques" },
        { id: "3", name: "Algèbre linéaire" },
      ],
      skills: ["Python", "Deep Learning"],
    };
    expect(profileEvidenceCount(solid)).toBe(EVIDENCE_FULL_ITEMS);
    expect(computeCompatibility(solid, mscAi()).evidenceCapped).toBeUndefined();
  });

  it("le plafond garde l'ordre entre les formations", () => {
    const uncapped = { ...thinM1, courses: [...thinM1.courses, { id: "2", name: "a" }, { id: "3", name: "b" }, { id: "4", name: "c" }] };
    const order = (profile: StudentProfile) =>
      FORMATIONS.filter((f) => !f.demo)
        .map((f) => ({ id: f.id, capped: computeCompatibility(profile, f).overallScore }))
        .sort((a, b) => b.capped - a.capped)
        .slice(0, 3)
        .map((r) => r.id);
    // Même tête de classement, profil plafonné ou non (les matières factices ne prouvent rien).
    expect(order(thinM1)).toEqual(order(uncapped));
  });

  it("les langues ne comptent pas comme preuves", () => {
    expect(profileEvidenceCount({ ...thinM1, languages: ["Français", "Anglais", "Espagnol"] })).toBe(2);
  });
});

describe("domaine de l'étudiant dans la recherche (2026-09-30)", () => {
  const catalogue = FORMATIONS.filter((f) => !f.demo);

  it("chaque formation relève au moins de son propre domaine", () => {
    for (const formation of catalogue) {
      expect(acceptsStudentDomain({ fieldOfStudy: formation.field }, formation)).toBe(true);
    }
  });

  it("un étudiant en Data & IA ne voit plus le droit ni la biologie parmi « son domaine »", () => {
    const mine = catalogue.filter((f) => acceptsStudentDomain({ fieldOfStudy: "Data Science & IA" }, f));
    expect(mine.length).toBeLessThan(catalogue.length / 2);
    expect(mine.some((f) => f.field === "Droit")).toBe(false);
    expect(mine.some((f) => f.field === "Data Science & IA")).toBe(true);
  });

  it("un domaine voisin n'entre que si la formation l'accepte dans ses prérequis officiels", () => {
    for (const formation of catalogue.filter((f) => f.field !== "Informatique")) {
      const accepted = acceptsStudentDomain({ fieldOfStudy: "Informatique" }, formation);
      const declared = formation.prerequisites.some(
        (r) => r.type === "domaine" && [r.value, ...(r.aliases ?? [])].includes("Informatique"),
      );
      expect(accepted).toBe(declared);
    }
  });
});
