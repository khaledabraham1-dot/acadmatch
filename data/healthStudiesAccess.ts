/**
 * Accès aux études de médecine, pharmacie, odontologie et maïeutique pour
 * les étudiants internationaux — encart affiché quand le domaine du profil
 * est « Biologie & Santé ».
 *
 * Pourquoi un encart et pas des fiches : ces filières ne s'obtiennent pas sur
 * dossier comme les formations du catalogue (sélection en fin de PASS/LAS en
 * France, concours en Belgique). Les présenter comme des fiches avec un score
 * de compatibilité laisserait croire à une admission accessible — c'est
 * pourtant la question n°1 des étudiants de ce domaine, donc on y répond
 * explicitement, source officielle à l'appui.
 *
 * Vérifié le 2026-09-27 sur les sources ci-dessous. Volontairement absent :
 * le pourcentage du quota « non-résidents » en Belgique — non publié sur les
 * sources officielles consultées et remis en cause par la Cour de justice de
 * l'UE en avril 2026 ; on ne l'affiche pas plutôt que de risquer un chiffre
 * faux. À revérifier chaque année (calendriers DAP et concours).
 */

export const HEALTH_STUDIES_VERIFIED_AT = "2026-09-27";

export interface HealthStudiesCountryRule {
  country: "France" | "Belgique";
  title: string;
  points: string[];
  source: { label: string; url: string };
}

export const HEALTH_STUDIES_ACCESS: HealthStudiesCountryRule[] = [
  {
    country: "France",
    title: "France : PASS ou L.AS, puis sélection",
    points: [
      "Hors UE avec un bac étranger : candidature en 1re année (PASS ou L.AS) uniquement par la demande d'admission préalable (DAP), via Études en France dans les pays concernés, et non par Parcoursup ; date limite habituelle : mi-décembre pour la rentrée suivante.",
      "L'entrée en 2e année de médecine, pharmacie, odontologie, maïeutique ou kinésithérapie se joue ensuite sur une sélection exigeante en fin de PASS ou de L.AS.",
      "Une L.AS (licence avec option Accès Santé, ex. Sciences de la vie à Nancy) garde une vraie licence en cas d'échec : c'est la voie la plus sûre.",
    ],
    source: {
      label: "Faculté de médecine Paris-Saclay : accès PASS/L.AS hors UE",
      url: "https://www.medecine.universite-paris-saclay.fr/formations/acces-direct-aux-etudes-de-sante/acces-en-premiere-annee-des-formations-de-sante-pass/las-pour-les-etudiants-extracommunautaires",
    },
  },
  {
    country: "Belgique",
    title: "Belgique francophone : concours d'entrée",
    points: [
      "Médecine et dentisterie : concours d'entrée organisé par l'ARES (session 2026 : jeudi 27 août ; inscription en ligne jusqu'au 5 juillet, 30 €).",
      "Les candidats classés sont admis jusqu'au nombre de places fixé chaque année par le gouvernement de la Fédération Wallonie-Bruxelles.",
      "Diplôme secondaire étranger : l'équivalence doit être obtenue avant la clôture des inscriptions au concours.",
    ],
    source: {
      label: "UMONS, Faculté de médecine : concours d'entrée",
      url: "https://web.umons.ac.be/fmp/fr/etudes/concours-dentree-medecine/",
    },
  },
];
