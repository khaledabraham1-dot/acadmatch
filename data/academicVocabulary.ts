import type { Domain } from "@/data/subjects";

/**
 * Intitulés d'enseignements courants de licence et de master, par domaine,
 * tels qu'ils apparaissent sur les relevés de notes français et maghrébins
 * (audit du 2026-09-30). Ils servent UNIQUEMENT à reconnaître qu'un libellé
 * saisi est une vraie matière (lib/matching/vocabulary.ts) : ils ne
 * s'ajoutent à aucune exigence de formation et ne changent aucun score par
 * eux-mêmes. Sans cette liste, un étudiant en droit qui écrit « Droit des
 * obligations » était signalé à tort.
 *
 * À enrichir quand un vrai relevé importé contient une matière réelle non
 * reconnue (jamais de mot inventé ou trop générique).
 */
export const COMMON_COURSE_TITLES: Record<Domain, string[]> = {
  Informatique: [
    "Architecture des ordinateurs", "Compilation", "Théorie des langages", "Programmation fonctionnelle",
    "Programmation web", "Programmation système", "Programmation C", "Programmation Java",
    "Structures de données", "Logique", "Mathématiques discrètes", "Recherche opérationnelle",
    "Sécurité informatique", "Cryptographie", "Systèmes distribués", "Réseaux", "Interfaces homme-machine",
    "Conception orientée objet", "UML", "Développement mobile", "Informatique théorique", "Calculabilité",
  ],
  "Data Science & IA": [
    "Apprentissage statistique", "Apprentissage profond", "Vision par ordinateur", "Fouille de données",
    "Science des données", "Statistique inférentielle", "Probabilités", "Optimisation convexe",
    "Traitement du signal", "Séries temporelles", "Analyse de données", "Visualisation de données",
    "Intelligence artificielle", "Apprentissage par renforcement", "Modèles graphiques",
  ],
  Mathématiques: [
    "Analyse", "Analyse réelle", "Analyse complexe", "Analyse fonctionnelle", "Analyse numérique",
    "Algèbre", "Algèbre linéaire", "Algèbre générale", "Arithmétique", "Topologie", "Géométrie",
    "Géométrie différentielle", "Calcul différentiel", "Équations différentielles", "Intégration",
    "Théorie de la mesure", "Probabilités", "Statistiques", "Processus stochastiques", "Suites et séries",
  ],
  Physique: [
    "Mécanique du point", "Mécanique classique", "Mécanique quantique", "Électromagnétisme", "Électrostatique",
    "Thermodynamique", "Physique statistique", "Optique", "Optique géométrique", "Ondes", "Relativité",
    "Physique nucléaire", "Physique du solide", "Physique des matériaux", "Électronique", "Mécanique des fluides",
  ],
  Chimie: [
    "Chimie générale", "Chimie organique", "Chimie inorganique", "Chimie analytique", "Chimie physique",
    "Atomistique", "Liaison chimique", "Cinétique chimique", "Thermochimie", "Électrochimie",
    "Chimie des solutions", "Spectroscopie", "Chimie quantique", "Polymères", "Chimie de coordination",
  ],
  "Sciences de l'ingénieur": [
    "Résistance des matériaux", "Mécanique des solides", "Automatique", "Électrotechnique", "Électronique",
    "Électronique numérique", "Traitement du signal", "Dessin technique", "Conception mécanique",
    "Science des matériaux", "Thermique", "Transferts thermiques", "Énergétique", "Systèmes embarqués",
    "Robotique", "Mécatronique", "Fabrication mécanique",
  ],
  "Biologie & Santé": [
    "Biologie cellulaire", "Biologie moléculaire", "Biologie animale", "Biologie végétale", "Biochimie",
    "Génétique", "Microbiologie", "Immunologie", "Physiologie", "Physiologie animale", "Physiologie végétale",
    "Écologie", "Évolution", "Neurosciences", "Anatomie", "Histologie", "Embryologie", "Pharmacologie",
    "Biostatistiques", "Épidémiologie", "Santé publique",
  ],
  "Économie & Gestion": [
    "Microéconomie", "Macroéconomie", "Économie générale", "Économie internationale", "Économie monétaire",
    "Économie publique", "Économétrie", "Statistiques", "Mathématiques pour l'économie", "Comptabilité générale",
    "Comptabilité analytique", "Contrôle de gestion", "Finance d'entreprise", "Finance de marché",
    "Gestion financière", "Marketing", "Management", "Gestion des ressources humaines", "Droit des affaires",
    "Histoire économique", "Fiscalité", "Audit",
  ],
  Droit: [
    "Droit des obligations", "Droit des contrats", "Droit civil", "Droit de la famille", "Droit des biens",
    "Droit constitutionnel", "Droit administratif", "Droit pénal", "Procédure pénale", "Procédure civile",
    "Droit commercial", "Droit des sociétés", "Droit des affaires", "Droit du travail", "Droit fiscal",
    "Droit international public", "Droit international privé", "Droit européen", "Droit de l'Union européenne",
    "Histoire du droit", "Introduction au droit", "Libertés fondamentales", "Finances publiques",
  ],
  "Sciences politiques": [
    "Science politique", "Introduction à la science politique", "Sociologie politique", "Histoire des idées politiques",
    "Relations internationales", "Politiques publiques", "Vie politique", "Institutions politiques",
    "Droit constitutionnel", "Économie politique", "Géopolitique", "Sociologie", "Histoire contemporaine",
    "Analyse des politiques publiques", "Théorie politique", "Politique comparée", "Méthodes des sciences sociales",
  ],
};
