import type { ChecklistItem, StudyProgram } from "@/types";
import { addChecklistLabelsOnce } from "@/lib/applications";
import { EEF_CAMPAIGN_BY_COUNTRY, OFFICIAL_CAMPAIGNS, type CampaignPhase, type OfficialCampaign } from "@/data/campaigns";
import { ETUDES_EN_FRANCE_COUNTRIES } from "@/data/visa";
import type { VisaAnswers } from "@/lib/visa";

/**
 * Quel calendrier officiel s'applique à une candidature (2026-10-02) ?
 *
 * Le point que les étudiants internationaux manquent le plus souvent : un
 * candidat hors UE qui RÉSIDE dans un pays « Études en France » ne passe pas
 * par Parcoursup ni par Mon Master pour une formation française, mais par
 * Campus France, avec des dates limites bien plus tôt (fin d'année civile).
 * Les écoles et les universités belges gardent leur propre calendrier.
 *
 * Dates : chaînes ISO comparées comme des chaînes (voir lib/calendar.ts).
 */

export type NationalPlatform = "parcoursup" | "monmaster";

export type CampaignKey = OfficialCampaign["id"] | "eef-generic" | "institution";

export interface CampaignGroup {
  key: CampaignKey;
  /** Calendrier relevé ; absent pour « Études en France » sans calendrier du pays, ou un calendrier d'établissement. */
  campaign?: OfficialCampaign;
  /** Vrai seulement si ces dates sont celles de la rentrée visée — sinon INDICATIVES (campagne précédente). */
  official: boolean;
  formations: StudyProgram[];
}

/**
 * Rentrée visée par une candidature déposée aujourd'hui : à partir de
 * septembre, les campagnes en cours préparent la rentrée de l'année suivante.
 */
export function targetIntake(todayIso: string): number {
  const year = Number(todayIso.slice(0, 4));
  const month = Number(todayIso.slice(5, 7));
  return month >= 9 ? year + 1 : year;
}

/**
 * Plateforme nationale française d'une formation, lue dans sa procédure
 * sourcée : Parcoursup pour une 1re année de licence/BUT, Mon Master pour un M1.
 */
export function nationalPlatformOf(formation: StudyProgram): NationalPlatform | null {
  if (formation.institution.country !== "France") return null;
  if (formation.goal === "Licence" && /Parcoursup/.test(formation.applicationProcedure)) return "parcoursup";
  if (formation.goal === "Master" && /Mon Master/.test(formation.applicationProcedure)) return "monmaster";
  return null;
}

/** Le candidat relève-t-il d'« Études en France » ? `null` = on ne sait pas encore (page Visa non remplie). */
export function residesInEefCountry(visa: VisaAnswers | null): boolean | null {
  if (!visa || !visa.residenceCountry) return null;
  return visa.citizenship === "hors-ue" && (ETUDES_EN_FRANCE_COUNTRIES as readonly string[]).includes(visa.residenceCountry);
}

export function campaignKeyFor(formation: StudyProgram, visa: VisaAnswers | null): CampaignKey {
  const platform = nationalPlatformOf(formation);
  if (!platform) return "institution";
  if (residesInEefCountry(visa)) return EEF_CAMPAIGN_BY_COUNTRY[visa!.residenceCountry] ?? "eef-generic";
  return platform;
}

/** Regroupe les formations suivies par calendrier : un bloc par calendrier, pas un par formation. */
export function groupByCampaign(formations: StudyProgram[], visa: VisaAnswers | null, todayIso: string): CampaignGroup[] {
  const intake = targetIntake(todayIso);
  const groups = new Map<CampaignKey, CampaignGroup>();
  for (const formation of formations) {
    const key = campaignKeyFor(formation, visa);
    if (!groups.has(key)) {
      const campaign = key === "eef-generic" || key === "institution" ? undefined : OFFICIAL_CAMPAIGNS[key];
      groups.set(key, { key, campaign, official: campaign?.intake === intake, formations: [] });
    }
    groups.get(key)!.formations.push(formation);
  }
  // Les calendriers datés d'abord, les calendriers d'établissement en dernier.
  const order = (group: CampaignGroup) => (group.campaign ? (group.official ? 0 : 1) : group.key === "eef-generic" ? 2 : 3);
  return [...groups.values()].sort((a, b) => order(a) - order(b));
}

/** Échéances officielles encore à venir : seules celles-ci peuvent devenir des rappels. */
export function upcomingPhases(group: CampaignGroup, todayIso: string): CampaignPhase[] {
  if (!group.official || !group.campaign) return [];
  return group.campaign.phases.filter((phase) => phase.end >= todayIso);
}

/** Libellé du rappel ajouté au suivi de candidature (repris dans le calendrier, sans doublon). */
export function campaignReminderLabel(campaign: OfficialCampaign, phase: CampaignPhase): string {
  return `${campaign.name} : ${phase.label}`;
}

/**
 * Transforme des échéances officielles en rappels datés du suivi de
 * candidature, sans doublon (deux clics n'ajoutent rien de plus) et sans
 * toucher à un rappel que l'étudiant a déjà redaté lui-même.
 */
export function addCampaignReminders(items: ChecklistItem[], campaign: OfficialCampaign, phases: CampaignPhase[]): ChecklistItem[] {
  const dueByLabel = new Map(phases.map((phase) => [campaignReminderLabel(campaign, phase), phase.end]));
  const before = new Set(items.map((item) => item.id));
  return addChecklistLabelsOnce(items, [...dueByLabel.keys()], campaign.source).map((item) =>
    before.has(item.id) ? item : { ...item, dueDate: dueByLabel.get(item.label) },
  );
}
