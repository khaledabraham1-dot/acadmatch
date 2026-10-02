import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { OFFICIAL_CAMPAIGNS } from "@/data/campaigns";
import { addCampaignReminders, campaignKeyFor, groupByCampaign, nationalPlatformOf, targetIntake, upcomingPhases } from "@/lib/campaigns";
import type { VisaAnswers } from "@/lib/visa";

const byId = (id: string) => FORMATIONS.find((f) => f.id === id)!;
const benin: VisaAnswers = { citizenship: "hors-ue", residenceCountry: "Bénin" };
const senegal: VisaAnswers = { citizenship: "hors-ue", residenceCountry: "Sénégal" };
const european: VisaAnswers = { citizenship: "ue", residenceCountry: "Bénin" };

describe("calendriers officiels", () => {
  it("rentrée visée : l'année suivante à partir de septembre", () => {
    expect(targetIntake("2026-10-02")).toBe(2027);
    expect(targetIntake("2027-02-10")).toBe(2027);
    expect(targetIntake("2027-08-31")).toBe(2027);
  });

  it("plateforme nationale lue dans la procédure sourcée", () => {
    expect(nationalPlatformOf(byId("f-licence-info-toulouse"))).toBe("parcoursup");
    expect(nationalPlatformOf(byId("f-master-bioinformatique-bordeaux"))).toBe("monmaster");
    expect(nationalPlatformOf(byId("f-mosig-grenoble-inp"))).toBeNull(); // plateforme de l'école
    expect(nationalPlatformOf(byId("f-date-uclouvain"))).toBeNull(); // Belgique
  });

  it("résident hors UE d'un pays Études en France : Campus France, pas Parcoursup/Mon Master", () => {
    const master = byId("f-master-bioinformatique-bordeaux");
    expect(campaignKeyFor(master, null)).toBe("monmaster");
    expect(campaignKeyFor(master, benin)).toBe("eef-benin");
    expect(campaignKeyFor(master, senegal)).toBe("eef-generic"); // calendrier du pays non relevé
    expect(campaignKeyFor(master, european)).toBe("monmaster"); // citoyen UE : pas de visa ni d'EEF
    expect(campaignKeyFor(byId("f-mosig-grenoble-inp"), benin)).toBe("institution");
  });

  it("dates de la campagne précédente : indicatives, jamais transformables en rappel", () => {
    const groups = groupByCampaign([byId("f-master-bioinformatique-bordeaux")], null, "2026-10-02");
    expect(groups[0].key).toBe("monmaster");
    expect(groups[0].official).toBe(false);
    expect(upcomingPhases(groups[0], "2026-10-02")).toEqual([]);
  });

  it("calendrier de la rentrée visée : officiel, seules les échéances à venir sont proposées", () => {
    const [group] = groupByCampaign([byId("f-licence-info-toulouse")], benin, "2026-10-02");
    expect(group.official).toBe(true);
    const upcoming = upcomingPhases(group, "2026-10-02");
    expect(upcoming.map((p) => p.end)).not.toContain("2026-10-01");
    expect(upcoming[0].end).toBe("2026-11-15");
  });

  it("regroupe par calendrier, établissements en dernier", () => {
    const groups = groupByCampaign(
      [byId("f-mosig-grenoble-inp"), byId("f-master-bioinformatique-bordeaux"), byId("f-master-chimie-strasbourg")],
      null,
      "2026-10-02",
    );
    expect(groups.map((g) => g.key)).toEqual(["monmaster", "institution"]);
    expect(groups[0].formations).toHaveLength(2);
  });

  it("chaque calendrier a une source officielle, des dates ISO ordonnées", () => {
    for (const campaign of Object.values(OFFICIAL_CAMPAIGNS)) {
      expect(campaign.source).toMatch(/^https:\/\/(www\.legifrance\.gouv\.fr|www\.[a-z]+\.campusfrance\.org)\//);
      for (const phase of campaign.phases) {
        expect(phase.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        if (phase.start) expect(phase.start <= phase.end).toBe(true);
      }
    }
  });

  it("les rappels ajoutés portent la date officielle, sans doublon au second clic", () => {
    const campaign = OFFICIAL_CAMPAIGNS["eef-benin"];
    const phases = campaign.phases.slice(1, 3);
    const once = addCampaignReminders([], campaign, phases);
    expect(once.map((i) => i.dueDate)).toEqual(["2026-11-15", "2026-11-20"]);
    expect(once[0].source).toBe(campaign.source);
    expect(addCampaignReminders(once, campaign, phases)).toEqual(once);
  });
});
