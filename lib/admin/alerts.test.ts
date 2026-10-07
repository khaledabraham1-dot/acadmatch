import { describe, expect, it } from "vitest";
import { buildDigest, escapeHtml, yesterdayUtc, type AlertInput } from "@/lib/admin/alerts";

const now = new Date("2026-10-08T06:00:00Z"); // un jeudi
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();
const request = (wanted: string, hours: number, status = "a-traiter") => ({
  wanted, institution: null, country: "France", source: "recherche-vide", profile_field: null, profile_level: null, created_at: hoursAgo(hours), status,
});
const base: AlertInput = {
  now,
  requests: [],
  feedback: [],
  aiYesterday: { costUsd: 0, calls: 0 },
  budgetUsd: 2,
  newAccounts: 0,
  overdueCatalogue: 0,
  formationName: (id) => `Formation ${id}`,
};

describe("alertes admin par e-mail", () => {
  it("n'envoie rien quand rien ne demande d'action", () => {
    expect(buildDigest(base)).toBeNull();
    // Des comptes créés seuls ne justifient pas un e-mail.
    expect(buildDigest({ ...base, newAccounts: 3 })).toBeNull();
  });

  it("prévient pour une formation demandée 3 fois et redemandée depuis hier", () => {
    const digest = buildDigest({ ...base, requests: [request("Master Finance", 2), request("master finance", 100), request("Master Finance", 300)] });
    expect(digest?.subject).toContain("1 formation très demandée");
    expect(digest?.text).toContain("Master Finance : 3 demandes (+1 depuis hier)");
  });

  it("ne relance pas une formation déjà traitée, trop peu demandée, ou sans nouvelle demande", () => {
    expect(buildDigest({ ...base, requests: [request("A", 2, "ajoutee"), request("A", 50, "ajoutee"), request("A", 60, "ajoutee")] })).toBeNull();
    expect(buildDigest({ ...base, requests: [request("B", 2), request("B", 50)] })).toBeNull();
    expect(buildDigest({ ...base, requests: [request("C", 30), request("C", 50), request("C", 60)] })).toBeNull();
  });

  it("résume les nouveaux avis et échappe les commentaires dans le HTML", () => {
    const digest = buildDigest({
      ...base,
      feedback: [
        { formation_id: "f1", helpfulness: "non", score_fairness: "trop-haut", comment: "<script>alert(1)</script>", created_at: hoursAgo(3) },
        { formation_id: "f2", helpfulness: "oui", score_fairness: "juste", comment: "", created_at: hoursAgo(40) },
      ],
    });
    expect(digest?.subject).toContain("1 nouvel avis");
    expect(digest?.text).toContain("Score trop haut : Formation f1");
    expect(digest?.html).not.toContain("<script>");
    expect(digest?.html).toContain("&lt;script&gt;");
  });

  it("prévient à 80 % du budget de l'IA, et dit quand le plafond est atteint", () => {
    expect(buildDigest({ ...base, aiYesterday: { costUsd: 1.5, calls: 40 } })).toBeNull();
    expect(buildDigest({ ...base, aiYesterday: { costUsd: 1.7, calls: 40 } })?.subject).toContain("budget IA à surveiller");
    expect(buildDigest({ ...base, aiYesterday: { costUsd: 2.1, calls: 60 } })?.text).toContain("plafond a été atteint");
  });

  it("ne rappelle le catalogue que le lundi", () => {
    expect(buildDigest({ ...base, overdueCatalogue: 4 })).toBeNull();
    const monday = new Date("2026-10-12T06:00:00Z");
    expect(buildDigest({ ...base, now: monday, overdueCatalogue: 4 })?.subject).toContain("catalogue à revérifier");
  });

  it("envoie quand même un e-mail d'essai demandé depuis l'admin", () => {
    const digest = buildDigest({ ...base, newAccounts: 2 }, { force: true });
    expect(digest?.subject).toContain("essai");
    expect(digest?.text).toContain("2 nouveaux comptes créés");
  });

  it("donne la journée UTC d'hier, celle du budget de l'IA", () => {
    expect(yesterdayUtc(now)).toEqual({ start: "2026-10-07T00:00:00.000Z", end: "2026-10-08T00:00:00.000Z" });
    expect(escapeHtml(`"a" & 'b'`)).toBe("&quot;a&quot; &amp; &#39;b&#39;");
  });
});
