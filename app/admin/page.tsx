import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { checkAdmin } from "@/lib/admin/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  aiUsageSummary,
  feedbackByFormation,
  groupFormationRequests,
  journeyFunnel,
  type AiUsageRow,
  type FeedbackRow,
  type JourneyRow,
  type RequestRow,
} from "@/lib/admin/stats";
import { outdatedCampaigns, outdatedFees, staleFormations, type HealthItem } from "@/lib/admin/catalogueHealth";
import { globalDailyBudgetUsd } from "@/lib/ai/config";
import { FORMATIONS } from "@/data/formations";
import { OFFICIAL_CAMPAIGNS } from "@/data/campaigns";
import { TUITION_FEES } from "@/data/budget";
import { LoginForm } from "@/components/account/LoginForm";
import { AccountDeletionForm } from "@/components/admin/AccountDeletionForm";
import { setRequestStatus } from "@/app/admin/actions";
import { ADMIN_MAX_SESSION_HOURS } from "@/lib/admin/access";
import type { RequestStatus } from "@/lib/admin/stats";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

// Données en direct, jamais mises en cache ni générées au build.
export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;
const MAX_ROWS = 5000;

const dateFr = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const usd = (value: number) => `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} $`;

/**
 * Espace admin V1 (2026-10-06), en lecture seule : ce qu'il faut savoir pour
 * piloter AcadMatch après le lancement, sans écrire de SQL. Accès réservé aux
 * adresses de ADMIN_EMAILS (lib/admin/session.ts) ; toute autre personne
 * connectée reçoit une page introuvable. Aucune donnée personnelle affichée.
 */
export default async function AdminPage() {
  const access = await checkAdmin();
  if (access.status === "anonymous") redirect("/compte?next=/admin");
  if (access.status === "reauth") {
    return (
      <AppShell title="Administration" description="Pour protéger les données, l'espace admin demande une connexion récente.">
        <LoginForm
          presetEmail={access.email}
          afterLogin="/admin"
          title="Confirmez votre identité"
          intro={`Votre dernière connexion date de plus de ${ADMIN_MAX_SESSION_HOURS} heures. Recevez un code ou un lien sur votre adresse pour ouvrir l'espace admin.`}
        />
      </AppShell>
    );
  }
  if (access.status !== "admin") notFound();

  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY).toISOString();
  const db = createAdminClient();
  const requestColumns = "wanted, institution, country, source, profile_field, profile_level, created_at";
  const [users, profiles, workspaces, journey, requestsWithStatus, feedback, ai, audit] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 1 }),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("workspaces").select("id", { count: "exact", head: true }),
    db.from("journey_events").select("step, detail, device, created_at").gte("created_at", since30).order("created_at", { ascending: false }).limit(MAX_ROWS),
    db.from("formation_requests").select(`${requestColumns}, status`).order("created_at", { ascending: false }).limit(MAX_ROWS),
    db.from("feedback").select("formation_id, helpfulness, score_fairness, comment, created_at").order("created_at", { ascending: false }).limit(MAX_ROWS),
    db.from("ai_usage").select("feature, cost_usd, created_at").gte("created_at", since30).order("created_at", { ascending: false }).limit(MAX_ROWS),
    db.from("admin_audit").select("created_at, admin_email, action, detail").order("created_at", { ascending: false }).limit(20),
  ]);
  // Migration 0010 pas encore exécutée : la colonne « status » manque, on relit sans elle.
  const actionsReady = !requestsWithStatus.error;
  const requests = actionsReady
    ? requestsWithStatus
    : await db.from("formation_requests").select(requestColumns).order("created_at", { ascending: false }).limit(MAX_ROWS);

  const failures = [
    users.error && "comptes",
    profiles.error && "profils",
    workspaces.error && "projets synchronisés",
    journey.error && "parcours",
    requests.error && "demandes de formation",
    feedback.error && "avis",
    ai.error && "usage de l'IA",
  ].filter(Boolean);

  const funnel = journeyFunnel((journey.data ?? []) as JourneyRow[], now);
  const requestGroups = groupFormationRequests((requests.data ?? []) as RequestRow[]);
  const feedbackSummary = feedbackByFormation((feedback.data ?? []) as FeedbackRow[]);
  const aiSummary = aiUsageSummary((ai.data ?? []) as AiUsageRow[], now);
  const budget = globalDailyBudgetUsd();
  const formationName = (id: string) => {
    const f = FORMATIONS.find((x) => x.id === id);
    return f ? `${f.name}, ${f.institution.name}` : id;
  };
  const health = {
    formations: staleFormations(FORMATIONS, now),
    campaigns: outdatedCampaigns(Object.values(OFFICIAL_CAMPAIGNS), now),
    fees: outdatedFees(TUITION_FEES, FORMATIONS, now),
  };
  const totalUsers = users.data && "total" in users.data ? users.data.total : null;

  return (
    <AppShell title="Administration" description={`Connecté en tant que ${access.email}. Données en direct, en lecture seule, sans donnée personnelle.`}>
      <div className="space-y-6">
        {failures.length > 0 && (
          <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-slate-800">
            Lecture impossible pour : {failures.join(", ")}. Vérifiez que les migrations Supabase sont exécutées.
          </p>
        )}

        <section aria-labelledby="chiffres" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <h2 id="chiffres" className="sr-only">Chiffres clés</h2>
          <Stat label="Comptes créés" value={totalUsers ?? "?"} />
          <Stat label="Profils sauvegardés" value={profiles.count ?? "?"} />
          <Stat label="Projets synchronisés" value={workspaces.count ?? "?"} />
          <Stat label="Résultats consultés (30 j)" value={funnel.find((l) => l.step === "resultat-vu")?.last30 ?? 0} />
        </section>

        <Section id="parcours" title="Parcours des visiteurs" hint="Chaque étape est comptée une fois par visite. Une forte chute entre deux étapes montre où les étudiants abandonnent.">
          <Table
            head={["Étape", "7 jours", "30 jours", "Sur mobile"]}
            rows={funnel.map((l) => [l.label, l.last7, l.last30, l.mobileShare === null ? "-" : `${l.mobileShare} %`])}
          />
        </Section>

        {!actionsReady && (
          <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-slate-800">
            Actions désactivées : exécutez la migration <code>0010_admin_actions.sql</code> dans Supabase pour suivre le statut des
            demandes et garder le journal des actions.
          </p>
        )}

        <Section id="demandes" title={`Formations demandées (${requestGroups.length})`} hint="Demandes « formation manquante », regroupées. En tête : les prochaines fiches à ajouter au catalogue.">
          {requestGroups.length === 0 ? (
            <Empty>Aucune demande pour l&apos;instant.</Empty>
          ) : (
            <Table
              head={["Formation demandée", "Demandes", "Pays", "Domaine des demandeurs", "Dernière", "Statut"]}
              rows={requestGroups.slice(0, 50).map((g) => [
                <span key="l">
                  {g.label}
                  {g.institutions.length > 0 && <span className="block text-xs text-slate-600">{g.institutions.slice(0, 3).join(", ")}</span>}
                </span>,
                g.count,
                g.countries.join(", ") || "-",
                g.fields.join(", ") || "-",
                dateFr(g.lastAt),
                actionsReady ? <StatusControl key="s" status={g.status} wanted={g.wantedValues} /> : "-",
              ])}
            />
          )}
        </Section>

        <Section id="avis" title={`Avis sur les résultats (${feedback.data?.length ?? 0})`} hint="En tête : les formations dont le score paraît le plus souvent faux. Elles sont à recalibrer en priorité.">
          {feedbackSummary.length === 0 ? (
            <Empty>Aucun avis pour l&apos;instant.</Empty>
          ) : (
            <div className="space-y-4">
              <Table
                head={["Formation", "Avis", "Utile", "Trop haut", "Juste", "Trop bas"]}
                rows={feedbackSummary.map((s) => [formationName(s.formationId), s.count, `${s.helpfulShare} %`, s.tooHigh, s.fair, s.tooLow])}
              />
              {feedbackSummary.some((s) => s.comments.length > 0) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">Derniers commentaires</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {feedbackSummary.flatMap((s) =>
                      s.comments.map((c) => (
                        <li key={`${s.formationId}-${c.at}`} className="rounded-xl bg-slate-50 px-4 py-2">
                          <span className="block text-xs text-slate-600">
                            {formationName(s.formationId)} · {dateFr(c.at)}
                          </span>
                          {c.text}
                        </li>
                      )),
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Section>

        <Section id="ia" title="Intelligence artificielle" hint="Budget quotidien global (variable AI_DAILY_BUDGET_USD sur Vercel). Au-delà, l'IA se met en pause jusqu'au lendemain.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Dépensé aujourd'hui" value={usd(aiSummary.today.costUsd)} hint={`sur ${usd(budget)} par jour`} />
            <Stat label="Appels aujourd'hui" value={aiSummary.today.calls} />
            <Stat label="Coût sur 30 jours" value={usd(aiSummary.costLast30)} />
          </div>
          {aiSummary.byFeature.length > 0 && (
            <Table head={["Fonctionnalité (30 jours)", "Appels", "Coût"]} rows={aiSummary.byFeature.map((f) => [f.feature, f.calls, usd(f.costUsd)])} />
          )}
          <Table
            head={["Jour", "Appels", "Coût"]}
            rows={aiSummary.days.filter((d) => d.calls > 0).map((d) => [dateFr(`${d.day}T12:00:00Z`), d.calls, usd(d.costUsd)])}
            emptyText="Aucun appel à l'IA sur les 14 derniers jours."
          />
        </Section>

        <Section id="exports" title="Exporter les données" hint="Fichiers CSV (Excel), données anonymes. Chaque export est inscrit au journal.">
          <div className="flex flex-wrap gap-2">
            {[
              ["demandes", "Demandes de formation"],
              ["avis", "Avis sur les résultats"],
              ["parcours", "Parcours des visiteurs"],
            ].map(([type, label]) => (
              <a key={type} href={`/admin/export?type=${type}`} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
                {label}
              </a>
            ))}
          </div>
        </Section>

        <Section id="rgpd" title="Supprimer un compte (demande d'un étudiant)" hint="Droit à l'effacement : supprime le compte, son profil et son projet synchronisé. Irréversible. Répondez à l'étudiant une fois fait.">
          <AccountDeletionForm />
        </Section>

        <Section id="catalogue" title="Santé du catalogue" hint="Ce qu'il faut revérifier sur les sources officielles (fiches de plus de 6 mois, calendriers et frais d'une année passée).">
          <HealthList title="Fiches à revérifier" items={health.formations} empty="Toutes les fiches ont été vérifiées il y a moins de 5 mois." />
          <HealthList title="Calendriers à mettre à jour" items={health.campaigns} empty="Tous les calendriers concernent la prochaine rentrée." />
          <HealthList title="Frais à mettre à jour" items={health.fees} empty="Tous les frais concernent l'année universitaire en cours." />
        </Section>

        <Section id="journal" title="Journal des actions admin" hint="Les 20 dernières actions : changements de statut, exports, suppressions de comptes.">
          <Table
            head={["Date", "Administrateur", "Action", "Détail"]}
            rows={((audit.data ?? []) as { created_at: string; admin_email: string; action: string; detail: string }[]).map((a) => [
              new Date(a.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
              a.admin_email,
              a.action,
              a.detail,
            ])}
            emptyText={actionsReady ? "Aucune action pour l'instant." : "Journal disponible après la migration 0010."}
          />
        </Section>
      </div>
    </AppShell>
  );
}

const STATUS_OPTIONS: { value: RequestStatus; label: string }[] = [
  { value: "a-traiter", label: "À traiter" },
  { value: "ajoutee", label: "Ajoutée" },
  { value: "refusee", label: "Refusée" },
];

/** Statut d'un groupe de demandes : trois petits boutons, l'actif est mis en avant. */
function StatusControl({ status, wanted }: { status: RequestStatus; wanted: string[] }) {
  return (
    <form action={setRequestStatus} className="flex flex-wrap gap-1">
      <input type="hidden" name="wanted" value={JSON.stringify(wanted)} />
      {STATUS_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="submit"
          name="status"
          value={option.value}
          aria-pressed={status === option.value}
          className={
            status === option.value
              ? "rounded-lg bg-blue-600 px-2 py-1 text-xs font-bold text-white"
              : "rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
          }
        >
          {option.label}
        </button>
      ))}
    </form>
  );
}

function Section({ id, title, hint, children }: { id: string; title: string; hint: string; children: ReactNode }) {
  return (
    <Card>
      <section aria-labelledby={id} className="space-y-4">
        <div>
          <h2 id={id} className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{hint}</p>
        </div>
        {children}
      </section>
    </Card>
  );
}

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

function Table({ head, rows, emptyText }: { head: string[]; rows: ReactNode[][]; emptyText?: string }) {
  if (rows.length === 0) return emptyText ? <Empty>{emptyText}</Empty> : null;
  return (
    <div className="overflow-x-auto rounded-[14px] border border-slate-200" tabIndex={0} role="region" aria-label={head[0]}>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top text-slate-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{children}</p>;
}

function HealthList({ title, items, empty }: { title: string; items: HealthItem[]; empty: string }) {
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        {title}
        <Badge tone={items.length ? "warning" : "success"}>{items.length}</Badge>
      </h3>
      {items.length === 0 ? (
        <Empty>{empty}</Empty>
      ) : (
        <ul className="space-y-1 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item.id}>
              <span className="font-medium text-slate-900">{item.label}</span>
              <span className="block text-xs text-slate-600">{item.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
