/**
 * Alertes admin par e-mail (2026-10-08) : un résumé envoyé chaque matin
 * (Vercel Cron, app/api/cron/alertes/route.ts), SEULEMENT quand il y a
 * quelque chose qui demande une action. Un e-mail tous les jours « rien à
 * signaler » finit ignoré ; un e-mail rare est lu.
 *
 * Ce qui déclenche l'envoi :
 * - une formation demandée au moins REQUEST_ALERT_THRESHOLD fois, encore
 *   « à traiter », et redemandée dans les dernières 24 h ;
 * - de nouveaux avis sur les résultats (surtout « score faux » et commentaires) ;
 * - le coût de l'IA d'hier à 80 % ou plus du budget quotidien ;
 * - le lundi seulement : des fiches du catalogue en retard de vérification.
 * Les nouveaux comptes sont mentionnés, mais ne déclenchent pas l'envoi seuls.
 *
 * Fonctions pures, testées (lib/admin/alerts.test.ts).
 */
import { groupFormationRequests, type FeedbackRow, type RequestRow } from "@/lib/admin/stats";

const DAY = 24 * 60 * 60 * 1000;

/** Nombre de demandes à partir duquel une formation mérite une fiche. */
export const REQUEST_ALERT_THRESHOLD = 3;
/** Part du budget quotidien de l'IA à partir de laquelle on prévient. */
export const AI_BUDGET_WARNING = 0.8;

export interface AlertInput {
  now: Date;
  requests: RequestRow[];
  feedback: FeedbackRow[];
  /** Coût et appels de l'IA sur la journée d'hier (UTC, comme le budget). */
  aiYesterday: { costUsd: number; calls: number };
  budgetUsd: number;
  newAccounts: number;
  overdueCatalogue: number;
  formationName: (id: string) => string;
}

export interface Digest {
  subject: string;
  text: string;
  html: string;
  /** Raisons de l'envoi (pour le journal admin). */
  reasons: string[];
}

interface Section {
  title: string;
  lines: string[];
}

const usd = (v: number) => `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Le résumé à envoyer, ou null s'il n'y a rien qui mérite un e-mail (sauf `force`, pour l'essai depuis l'admin). */
export function buildDigest(input: AlertInput, { force = false }: { force?: boolean } = {}): Digest | null {
  const since = input.now.getTime() - DAY;
  const recent = (iso: string) => new Date(iso).getTime() >= since;
  const sections: Section[] = [];
  const reasons: string[] = [];
  const subject: string[] = [];

  // 1. Formations très demandées, redemandées depuis hier.
  const hot = groupFormationRequests(input.requests)
    .filter((g) => g.status === "a-traiter" && g.count >= REQUEST_ALERT_THRESHOLD)
    .map((g) => ({ ...g, fresh: input.requests.filter((r) => g.wantedValues.includes(r.wanted) && recent(r.created_at)).length }))
    .filter((g) => g.fresh > 0);
  if (hot.length) {
    sections.push({
      title: "Formations à ajouter au catalogue",
      lines: hot.slice(0, 10).map((g) => `${g.label} : ${plural(g.count, "demande", "demandes")} (+${g.fresh} depuis hier)${g.countries.length ? `, ${g.countries.join(", ")}` : ""}`),
    });
    reasons.push(`${hot.length} formation(s) très demandée(s)`);
    subject.push(plural(hot.length, "formation très demandée", "formations très demandées"));
  }

  // 2. Nouveaux avis.
  const fresh = input.feedback.filter((f) => recent(f.created_at));
  if (fresh.length) {
    const wrong = fresh.filter((f) => f.score_fairness === "trop-haut" || f.score_fairness === "trop-bas");
    const lines = [
      `${plural(fresh.length, "nouvel avis", "nouveaux avis")}, dont ${plural(wrong.length, "score jugé faux", "scores jugés faux")}.`,
      ...wrong.slice(0, 5).map((f) => `Score ${f.score_fairness === "trop-haut" ? "trop haut" : "trop bas"} : ${input.formationName(f.formation_id)}`),
      ...fresh
        .filter((f) => f.comment.trim())
        .slice(0, 5)
        .map((f) => `« ${f.comment.trim().slice(0, 300)} » (${input.formationName(f.formation_id)})`),
    ];
    sections.push({ title: "Avis sur les résultats", lines });
    reasons.push(`${fresh.length} nouvel(s) avis`);
    subject.push(plural(fresh.length, "nouvel avis", "nouveaux avis"));
  }

  // 3. Budget de l'IA.
  const share = input.budgetUsd > 0 ? input.aiYesterday.costUsd / input.budgetUsd : 0;
  if (share >= AI_BUDGET_WARNING) {
    const reached = share >= 1;
    sections.push({
      title: "Budget de l'IA",
      lines: [
        `Hier : ${usd(input.aiYesterday.costUsd)} sur ${usd(input.budgetUsd)} (${Math.round(share * 100)} %), ${plural(input.aiYesterday.calls, "appel", "appels")}.`,
        reached
          ? "Le plafond a été atteint : l'IA s'est mise en pause jusqu'à minuit (UTC). Si c'est un vrai succès, relevez AI_DAILY_BUDGET_USD sur Vercel."
          : "Le plafond approche. Si la hausse continue, l'IA se mettra en pause en fin de journée.",
      ],
    });
    reasons.push(`IA à ${Math.round(share * 100)} % du budget`);
    subject.push(reached ? "budget IA atteint" : "budget IA à surveiller");
  }

  // 4. Catalogue (le lundi seulement, pour ne pas répéter la même chose tous les jours).
  if (input.overdueCatalogue > 0 && input.now.getUTCDay() === 1) {
    sections.push({
      title: "Catalogue",
      lines: [`${plural(input.overdueCatalogue, "fiche ou donnée à revérifier", "fiches ou données à revérifier")} sur les sources officielles (onglet Catalogue de l'admin).`],
    });
    reasons.push(`${input.overdueCatalogue} élément(s) du catalogue à revérifier`);
    subject.push("catalogue à revérifier");
  }

  if (!reasons.length && !force) return null;

  if (input.newAccounts > 0) {
    sections.push({ title: "Comptes", lines: [`${plural(input.newAccounts, "nouveau compte créé", "nouveaux comptes créés")} depuis hier.`] });
  }
  if (!sections.length) sections.push({ title: "Rien à signaler", lines: ["Aucune nouvelle demande importante, aucun avis, budget de l'IA normal."] });

  const title = subject.length ? `AcadMatch : ${subject.join(", ")}` : "AcadMatch : e-mail d'essai des alertes";
  const footer = "Détail en direct dans votre espace admin (adresse secrète, dans vos favoris). Vous recevez ce résumé seulement quand quelque chose demande votre attention.";
  return {
    subject: title,
    text: [title, "", ...sections.flatMap((s) => [s.title.toUpperCase(), ...s.lines.map((l) => `- ${l}`), ""]), footer].join("\n"),
    html: renderHtml(title, sections, footer),
    reasons: reasons.length ? reasons : ["essai manuel"],
  };
}

/** Les commentaires viennent d'inconnus : tout texte est échappé avant d'entrer dans le HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function renderHtml(title: string, sections: Section[], footer: string): string {
  const body = sections
    .map(
      (s) =>
        `<h2 style="margin:24px 0 8px;font-size:16px;color:#0f172a">${escapeHtml(s.title)}</h2><ul style="margin:0;padding-left:20px;color:#334155;font-size:14px;line-height:1.6">${s.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`,
    )
    .join("");
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f8fafc;font-family:system-ui,-apple-system,'Segoe UI',sans-serif"><div style="max-width:560px;margin:0 auto;padding:24px"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px"><h1 style="margin:0;font-size:18px;color:#0f172a">${escapeHtml(title)}</h1>${body}<p style="margin:24px 0 0;font-size:12px;color:#64748b">${escapeHtml(footer)}</p></div></div></body></html>`;
}

/** Journée UTC d'hier [début, fin[ — le budget de l'IA se compte en jours UTC. */
export function yesterdayUtc(now: Date): { start: string; end: string } {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { start: new Date(end.getTime() - DAY).toISOString(), end: end.toISOString() };
}
