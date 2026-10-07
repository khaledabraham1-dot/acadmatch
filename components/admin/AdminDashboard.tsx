"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  ChevronDown,
  Download,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Route,
  Search,
  Settings2,
  Smartphone,
  Stethoscope,
} from "lucide-react";
import type { DashboardData, Period, RequestDetail, Trend } from "@/lib/admin/dashboard";
import type { RequestStatus } from "@/lib/admin/stats";
import type { HealthItem } from "@/lib/admin/catalogueHealth";
import { setRequestStatus } from "@/app/admin/actions";
import { AccountDeletionForm } from "@/components/admin/AccountDeletionForm";
import { AnimatedNumber, DailyBars, GrowBar, LineChart, ORDINAL, SERIES, STATUS, Sparkline, StackedBar, formatInt, formatUsd, shortDay } from "@/components/admin/charts";
import { cn } from "@/lib/utils";

/**
 * Tableau de bord admin V3 (2026-10-07) : tout se lit à l'écran, en direct.
 * Les données sont relues toutes les 30 secondes (et au retour sur l'onglet)
 * depuis l'adresse secrète + /donnees ; une nouvelle demande ou un nouvel
 * avis s'annonce par une notification. L'export CSV reste disponible en un
 * clic, mais n'est plus nécessaire pour consulter quoi que ce soit.
 */

const REFRESH_MS = 30_000;

type Tab = "apercu" | "parcours" | "demandes" | "avis" | "ia" | "catalogue" | "gestion";
const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "apercu", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "parcours", label: "Parcours", icon: Route },
  { id: "demandes", label: "Demandes", icon: Inbox },
  { id: "avis", label: "Avis", icon: MessageSquare },
  { id: "ia", label: "IA", icon: Bot },
  { id: "catalogue", label: "Catalogue", icon: Stethoscope },
  { id: "gestion", label: "Gestion", icon: Settings2 },
];

const STATUS_LABEL: Record<RequestStatus, string> = { "a-traiter": "À traiter", ajoutee: "Ajoutée", refusee: "Refusée" };
const FAIRNESS = { "trop-haut": "Score trop haut", juste: "Score juste", "trop-bas": "Score trop bas" } as const;

interface Toast { id: number; text: string; error?: boolean }

export function AdminDashboard({ initial, base, email }: { initial: DashboardData; base: string; email: string }) {
  const [data, setData] = useState(initial);
  const [period, setPeriod] = useState<Period>(initial.period);
  const [state, setState] = useState<"live" | "loading" | "error" | "expired">("live");
  const [tab, setTab] = useState<Tab>("apercu");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const latest = useRef(initial);

  const notify = useCallback((text: string, error = false) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, text, error }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 7000);
  }, []);

  const refresh = useCallback(
    async (p: Period) => {
      setState((s) => (s === "expired" ? s : "loading"));
      try {
        const response = await fetch(`${base}/donnees?jours=${p}`, { cache: "no-store" });
        if (response.status === 404) return setState("expired");
        if (!response.ok) return setState("error");
        const next = (await response.json()) as DashboardData;
        const before = latest.current;
        const newRequests = totalRequests(next) - totalRequests(before);
        const newFeedback = next.feedback.total - before.feedback.total;
        const newAccounts = (next.kpis.accounts.total ?? 0) - (before.kpis.accounts.total ?? 0);
        if (newRequests > 0) notify(`${newRequests} nouvelle${newRequests > 1 ? "s" : ""} demande${newRequests > 1 ? "s" : ""} de formation`);
        if (newFeedback > 0) notify(`${newFeedback} nouvel${newFeedback > 1 ? "s" : ""} avis sur les résultats`);
        if (newAccounts > 0) notify(`${newAccounts} nouveau${newAccounts > 1 ? "x" : ""} compte${newAccounts > 1 ? "s" : ""} créé${newAccounts > 1 ? "s" : ""}`);
        latest.current = next;
        setData(next);
        setState("live");
      } catch {
        setState("error");
      }
    },
    [base, notify],
  );

  // Rafraîchissement automatique, seulement quand l'onglet est visible.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh(period);
    }, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && void refresh(period);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [period, refresh]);

  // Onglet mémorisé dans l'adresse (#demandes…) : un rechargement garde la vue.
  useEffect(() => {
    // Après l'hydratation (le serveur ne connaît pas le #), pour éviter un écart de rendu.
    const fromHash = () => {
      const hash = window.location.hash.slice(1) as Tab;
      if (TABS.some((t) => t.id === hash)) setTab(hash);
    };
    const id = requestAnimationFrame(fromHash);
    window.addEventListener("hashchange", fromHash);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("hashchange", fromHash);
    };
  }, []);
  const openTab = (next: Tab) => {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
  };

  const changePeriod = (p: Period) => {
    setPeriod(p);
    void refresh(p);
  };

  const pending = data.requests.filter((r) => r.status === "a-traiter").length;
  const healthCount = data.health.formations.length + data.health.campaigns.length + data.health.fees.length;
  const badges: Partial<Record<Tab, number>> = { demandes: pending, avis: data.kpis.feedback.current, catalogue: healthCount };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <LiveIndicator state={state} at={data.generatedAt} onRefresh={() => void refresh(period)} />
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-slate-600 sm:inline">Période</span>
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="Période">
            {([7, 30, 90] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => changePeriod(p)}
                aria-pressed={period === p}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-bold transition-colors", period === p ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100")}
              >
                {p} j
              </button>
            ))}
          </div>
        </div>
      </header>

      {state === "expired" && (
        <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-slate-800">
          Votre session admin a expiré. <button type="button" className="font-bold underline" onClick={() => window.location.reload()}>Rechargez la page</button> pour vous reconnecter.
        </p>
      )}
      {data.failures.length > 0 && (
        <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-slate-800">
          Lecture impossible pour : {data.failures.join(", ")}. Vérifiez que les migrations Supabase sont exécutées.
        </p>
      )}

      <nav aria-label="Sections de l'admin" className="sticky top-0 z-20 -mx-1 overflow-x-auto bg-[color:var(--background,#f8fafc)]/90 px-1 py-1 backdrop-blur">
        <div className="flex min-w-max gap-1 rounded-2xl border border-slate-200 bg-white p-1" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              onClick={() => openTab(id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors",
                tab === id ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
              {!!badges[id] && (
                <span className={cn("rounded-full px-1.5 text-xs", tab === id ? "bg-white/25 text-white" : "bg-blue-50 text-blue-700")}>{badges[id]}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <div key={`${tab}-${period}`} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="admin-rise space-y-5">
        {tab === "apercu" && <Overview data={data} openTab={openTab} />}
        {tab === "parcours" && <Journey data={data} base={base} />}
        {tab === "demandes" && <Requests data={data} base={base} onChanged={() => void refresh(period)} notify={notify} />}
        {tab === "avis" && <Feedback data={data} base={base} />}
        {tab === "ia" && <Ai data={data} />}
        {tab === "catalogue" && <Catalogue health={data.health} />}
        {tab === "gestion" && <Management data={data} email={email} />}
      </div>

      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-72 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="admin-rise flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
            <span className="relative flex size-2.5 shrink-0">
              <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75", t.error ? "bg-red-400" : "bg-emerald-400")} />
              <span className={cn("relative inline-flex size-2.5 rounded-full", t.error ? "bg-red-400" : "bg-emerald-400")} />
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

const totalRequests = (d: DashboardData) => d.requests.reduce((s, r) => s + r.count, 0);

/* ---------- En-tête ---------- */

function LiveIndicator({ state, at, onRefresh }: { state: string; at: string; onRefresh: () => void }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 5000);
    return () => window.clearInterval(id);
  }, []);
  const ok = state === "live" || state === "loading";
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-bold text-slate-800 ring-1 ring-slate-200">
        <span className="relative flex size-2.5">
          {ok && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />}
          <span className={cn("relative inline-flex size-2.5 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />
        </span>
        {ok ? "En direct" : "Hors ligne"}
      </span>
      <span>Mis à jour {timeAgo(at)}</span>
      <button type="button" onClick={onRefresh} className="grid size-8 place-items-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900" aria-label="Actualiser maintenant">
        <RefreshCw className={cn("size-4", state === "loading" && "animate-spin")} aria-hidden />
      </button>
    </div>
  );
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 10) return "à l'instant";
  if (seconds < 60) return `il y a ${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "hier" : `il y a ${days} jours`;
}

/* ---------- Briques ---------- */

function Panel({ title, hint, action, children, className }: { title: string; hint?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-slate-600">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Delta({ trend, upIsGood = true }: { trend: Pick<Trend, "current" | "previous">; upIsGood?: boolean }) {
  if (trend.previous === 0) {
    return trend.current > 0 ? <span className="text-xs font-semibold text-slate-500">Nouveau sur la période</span> : <span className="text-xs text-slate-500">Aucune donnée avant</span>;
  }
  const change = Math.round(((trend.current - trend.previous) / trend.previous) * 100);
  const up = change >= 0;
  const good = change === 0 ? null : up === upIsGood;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold", good === null ? "bg-slate-100 text-slate-700" : good ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>
      <Icon className="size-3.5" aria-hidden />
      {up ? "+" : ""}
      {change} %<span className="sr-only"> par rapport à la période précédente</span>
    </span>
  );
}

function KpiTile({ label, trend, value, format = formatInt, color = SERIES[0], upIsGood, sub, hideDelta }: { label: string; trend: Trend; value?: number; format?: (v: number) => string; color?: string; upIsGood?: boolean; sub?: ReactNode; hideDelta?: boolean }) {
  return (
    <div className="admin-rise rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        <AnimatedNumber value={value ?? trend.current} format={format} />
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {!hideDelta && <Delta trend={trend} upIsGood={upIsGood} />}
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </div>
      <div className="mt-2">
        <Sparkline values={trend.series} color={color} />
      </div>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">{children}</p>;
}

function CsvLink({ base, type }: { base: string; type: "demandes" | "avis" | "parcours" }) {
  return (
    <a href={`${base}/export?type=${type}`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900">
      <Download className="size-3.5" aria-hidden />
      CSV
    </a>
  );
}

function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span className="h-0.5 w-4 rounded-full" style={{ background: i.color, height: 3 }} aria-hidden />
          {i.label}
          {i.value && <strong className="text-slate-900">{i.value}</strong>}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Vue d'ensemble ---------- */

function Overview({ data, openTab }: { data: DashboardData; openTab: (t: Tab) => void }) {
  const { kpis } = data;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Résultats consultés" trend={kpis.results} />
        <KpiTile label="Profils enregistrés" trend={kpis.profiles} color={SERIES[1]} />
        <KpiTile
          label="Comptes"
          trend={kpis.accounts.created}
          value={kpis.accounts.total ?? kpis.accounts.created.current}
          color={SERIES[2]}
          hideDelta
          sub={`+${kpis.accounts.created.current} nouveaux sur la période · ${kpis.accounts.active} actifs`}
        />
        <KpiTile label="Demandes de formation" trend={kpis.requests} color={SERIES[1]} />
      </div>

      <Panel title="Activité par jour" hint="Survolez la courbe pour lire chaque jour.">
        <ActivityChart data={data} />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Où les étudiants s'arrêtent" action={<GoTo onClick={() => openTab("parcours")}>Détail</GoTo>}>
          <Funnel data={data} compact />
        </Panel>
        <Panel title="Formations les plus demandées" action={<GoTo onClick={() => openTab("demandes")}>Toutes</GoTo>}>
          {data.requests.length === 0 ? (
            <Empty>Aucune demande pour l&apos;instant.</Empty>
          ) : (
            <ol className="space-y-3">
              {data.requests.slice(0, 5).map((r) => (
                <li key={r.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-slate-900">{r.label}</span>
                    <strong className="shrink-0 text-slate-900">{r.count}</strong>
                  </div>
                  <GrowBar percent={(r.count / data.requests[0].count) * 100} color={SERIES[1]} height={8} />
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Derniers avis" action={<GoTo onClick={() => openTab("avis")}>Tous</GoTo>}>
          <Comments comments={data.feedback.comments.slice(0, 3)} />
        </Panel>
        <Panel title="Intelligence artificielle aujourd'hui" action={<GoTo onClick={() => openTab("ia")}>Détail</GoTo>}>
          <BudgetGauge data={data} />
        </Panel>
      </div>
    </>
  );
}

function GoTo({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="rounded-lg px-2 py-1 text-sm font-bold text-blue-700 hover:bg-blue-50">
      {children} →
    </button>
  );
}

function ActivityChart({ data }: { data: DashboardData }) {
  const series = data.activity.map((s, i) => ({ label: s.label, color: SERIES[i], values: s.values }));
  const hasData = series.some((s) => s.values.some((v) => v > 0));
  if (!hasData) return <Empty>Aucune activité enregistrée sur cette période.</Empty>;
  return (
    <>
      <Legend items={series.map((s) => ({ label: s.label, color: s.color, value: formatInt(s.values.reduce((a, b) => a + b, 0)) }))} />
      <LineChart days={data.days} series={series} />
    </>
  );
}

/* ---------- Parcours ---------- */

function Funnel({ data, compact }: { data: DashboardData; compact?: boolean }) {
  const top = Math.max(1, ...data.funnel.map((s) => s.count));
  if (data.funnel.every((s) => s.count === 0)) return <Empty>Aucun passage enregistré sur cette période.</Empty>;
  return (
    <ol className="space-y-1">
      {data.funnel.map((s, i) => (
        <li key={s.step}>
          {s.fromPrevious !== null && (
            <p className="flex items-center gap-2 py-1 pl-2 text-xs text-slate-600">
              <span aria-hidden>↓</span>
              <strong className={cn(s.fromPrevious < 40 ? "text-red-700" : "text-slate-900")}>{s.fromPrevious} %</strong> continuent
              {s.fromPrevious < 100 && <span className="text-slate-500">· {100 - s.fromPrevious} % s&apos;arrêtent ici</span>}
            </p>
          )}
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-slate-900">{s.label}</span>
            <span className="flex shrink-0 items-center gap-2">
              <strong className="text-slate-900">
                <AnimatedNumber value={s.count} />
              </strong>
              {!compact && <Delta trend={{ current: s.count, previous: s.previous }} />}
            </span>
          </div>
          <div className="mt-1">
            <GrowBar percent={(s.count / top) * 100} color={ORDINAL[i]} height={compact ? 10 : 14} />
          </div>
          {!compact && s.mobileShare !== null && <p className="mt-1 text-xs text-slate-500">{s.mobileShare} % sur mobile</p>}
        </li>
      ))}
    </ol>
  );
}

function Journey({ data, base }: { data: DashboardData; base: string }) {
  return (
    <>
      <Panel title="Activité par jour" hint="Chaque étape est comptée une fois par visite." action={<CsvLink base={base} type="parcours" />}>
        <ActivityChart data={data} />
      </Panel>
      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <Panel title="Entonnoir" hint="Le chemin principal d'un étudiant. Une forte chute entre deux étapes montre où il abandonne.">
          <Funnel data={data} />
        </Panel>
        <div className="space-y-5">
          <Panel title="Autres actions">
            <ul className="grid grid-cols-2 gap-3">
              {data.side.map((s) => (
                <li key={s.step} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-600">{s.label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    <AnimatedNumber value={s.count} />
                  </p>
                  <Delta trend={{ current: s.count, previous: s.previous }} />
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Appareils" action={<Smartphone className="size-4 text-slate-500" aria-hidden />}>
            <StackedBar
              parts={[
                { label: "Mobile", value: data.devices.mobile, color: SERIES[0] },
                { label: "Ordinateur", value: data.devices.computer, color: SERIES[1] },
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}

/* ---------- Demandes ---------- */

type RequestFilter = RequestStatus | "toutes";

function Requests({ data, base, onChanged, notify }: { data: DashboardData; base: string; onChanged: () => void; notify: (t: string, error?: boolean) => void }) {
  const [filter, setFilter] = useState<RequestFilter>("a-traiter");
  const [query, setQuery] = useState("");
  const [overrides, setOverrides] = useState<Record<string, RequestStatus>>({});
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.requests
      .map((r) => ({ ...r, status: overrides[r.label] ?? r.status }))
      .filter((r) => filter === "toutes" || r.status === filter)
      .filter((r) => !q || [r.label, ...r.institutions, ...r.fields, ...r.queries].some((v) => v.toLowerCase().includes(q)));
  }, [data.requests, overrides, filter, query]);
  const counts = useMemo(() => {
    const c: Record<RequestFilter, number> = { "a-traiter": 0, ajoutee: 0, refusee: 0, toutes: data.requests.length };
    for (const r of data.requests) c[overrides[r.label] ?? r.status]++;
    return c;
  }, [data.requests, overrides]);
  const max = Math.max(1, ...data.requests.map((r) => r.count));

  async function changeStatus(r: RequestDetail, status: RequestStatus) {
    setOverrides((o) => ({ ...o, [r.label]: status }));
    const form = new FormData();
    form.set("status", status);
    form.set("wanted", JSON.stringify(r.wantedValues));
    const result = await setRequestStatus(form);
    if (!result.ok) {
      setOverrides((o) => {
        const next = { ...o };
        delete next[r.label];
        return next;
      });
      notify("Le statut n'a pas pu être enregistré. Rechargez la page.", true);
      return;
    }
    notify(`« ${r.label} » : ${STATUS_LABEL[status].toLowerCase()}`);
    onChanged();
  }

  return (
    <Panel
      title="Formations demandées"
      hint="Demandes « formation manquante », regroupées. En tête : les prochaines fiches à ajouter au catalogue."
      action={<CsvLink base={base} type="demandes" />}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Filtrer par statut">
          {(["a-traiter", "ajoutee", "refusee", "toutes"] as RequestFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn("rounded-lg px-3 py-1.5 text-sm font-bold transition-colors", filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
            >
              {f === "toutes" ? "Toutes" : STATUS_LABEL[f]} <span className="text-slate-500">{counts[f]}</span>
            </button>
          ))}
        </div>
        <label className="relative ml-auto min-w-48 flex-1 sm:max-w-xs">
          <span className="sr-only">Rechercher une demande</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </label>
      </div>
      {!data.actionsReady && (
        <p className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-slate-800">
          Statuts désactivés : exécutez la migration <code>0010_admin_actions.sql</code> dans Supabase.
        </p>
      )}
      {list.length === 0 ? (
        <Empty>{data.requests.length === 0 ? "Aucune demande pour l'instant." : "Aucune demande dans cette catégorie."}</Empty>
      ) : (
        <ul className="space-y-3">
          {list.map((r, i) => (
            <RequestCard key={r.label} request={r} max={max} index={i} canEdit={data.actionsReady} onStatus={(s) => void changeStatus(r, s)} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RequestCard({ request: r, max, index, canEdit, onStatus }: { request: RequestDetail; max: number; index: number; canEdit: boolean; onStatus: (s: RequestStatus) => void }) {
  const [open, setOpen] = useState(false);
  const chips = [...r.countries, ...r.fields, ...r.levels];
  return (
    <li className="admin-rise rounded-2xl border border-slate-200 p-4 transition-shadow hover:shadow-md" style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-bold text-slate-900">
            {r.label}
            {r.recent > 0 && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">+{r.recent} récente{r.recent > 1 ? "s" : ""}</span>}
          </p>
          {r.institutions.length > 0 && <p className="mt-0.5 text-sm text-slate-600">{r.institutions.slice(0, 3).join(" · ")}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold leading-none text-slate-900">{r.count}</p>
          <p className="text-xs text-slate-500">demande{r.count > 1 ? "s" : ""}</p>
        </div>
      </div>
      <div className="mt-3">
        <GrowBar percent={(r.count / max) * 100} color={SERIES[1]} height={6} />
      </div>
      {chips.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <li key={c} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {c}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
          Dernière le {shortDay(r.lastAt.slice(0, 10))}
        </button>
        {canEdit && (
          <div className="inline-flex rounded-xl border border-slate-200 p-0.5" role="group" aria-label={`Statut de « ${r.label} »`}>
            {(["a-traiter", "ajoutee", "refusee"] as RequestStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => r.status !== s && onStatus(s)}
                aria-pressed={r.status === s}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
                  r.status === s ? (s === "ajoutee" ? "bg-emerald-600 text-white" : s === "refusee" ? "bg-slate-700 text-white" : "bg-blue-600 text-white") : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>
      {open && (
        <dl className="admin-rise mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-2">
          <Detail label="Recherches tapées" values={r.queries} />
          <Detail label="Diplôme visé" values={r.goals} />
          <Detail label="Origine de la demande" values={r.sources} />
          <Detail label="Intitulés reçus" values={r.wantedValues.slice(0, 5)} />
        </dl>
      )}
    </li>
  );
}

function Detail({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="text-slate-800">{values.length ? values.join(" · ") : "-"}</dd>
    </div>
  );
}

/* ---------- Avis ---------- */

function Feedback({ data, base }: { data: DashboardData; base: string }) {
  const f = data.feedback;
  const rated = f.fairness.tooHigh + f.fairness.fair + f.fairness.tooLow;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiTile label="Avis reçus" trend={data.kpis.feedback} value={f.total} color={SERIES[0]} hideDelta sub={`${data.kpis.feedback.current} sur la période`} />
        <StatTile label="Trouvent le résultat utile" value={f.total ? Math.round((f.helpfulness.oui / f.total) * 100) : 0} suffix=" %" />
        <StatTile label="Jugent le score juste" value={rated ? Math.round((f.fairness.fair / rated) * 100) : 0} suffix=" %" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Le score paraît-il juste ?" hint="Avis des étudiants sur leur score.">
          <StackedBar
            parts={[
              { label: "Trop bas", value: f.fairness.tooLow, color: SERIES[0] },
              { label: "Juste", value: f.fairness.fair, color: STATUS.good },
              { label: "Trop haut", value: f.fairness.tooHigh, color: STATUS.critical },
            ]}
          />
        </Panel>
        <Panel title="Le résultat est-il utile ?">
          <StackedBar
            parts={[
              { label: "Oui", value: f.helpfulness.oui, color: STATUS.good },
              { label: "En partie", value: f.helpfulness.partiellement, color: STATUS.warning },
              { label: "Non", value: f.helpfulness.non, color: STATUS.critical },
            ]}
          />
        </Panel>
      </div>
      <Panel title="Formations à recalibrer" hint="En tête : celles dont le score paraît le plus souvent faux." action={<CsvLink base={base} type="avis" />}>
        {f.byFormation.length === 0 ? (
          <Empty>Aucun avis pour l&apos;instant.</Empty>
        ) : (
          <ul className="space-y-4">
            {f.byFormation.map((s) => (
              <li key={s.formationId}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-900">{s.name}</span>
                  <span className="shrink-0 text-slate-600">
                    {s.count} avis · {s.helpfulShare} % utile
                  </span>
                </div>
                <StackedBar
                  height={8}
                  parts={[
                    { label: "Trop bas", value: s.tooLow, color: SERIES[0] },
                    { label: "Juste", value: s.fair, color: STATUS.good },
                    { label: "Trop haut", value: s.tooHigh, color: STATUS.critical },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Commentaires" hint="Les plus récents d'abord.">
        <Comments comments={f.comments} />
      </Panel>
    </>
  );
}

function StatTile({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="admin-rise rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        <AnimatedNumber value={value} format={(v) => `${formatInt(v)}${suffix}`} />
      </p>
      <div className="mt-3">
        <GrowBar percent={value} color={SERIES[0]} height={6} />
      </div>
    </div>
  );
}

function Comments({ comments }: { comments: DashboardData["feedback"]["comments"] }) {
  if (comments.length === 0) return <Empty>Aucun commentaire pour l&apos;instant.</Empty>;
  return (
    <ul className="space-y-3">
      {comments.map((c, i) => (
        <li key={`${c.at}-${i}`} className="admin-rise rounded-2xl bg-slate-50 p-4" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">{c.name}</span>
            <span>· {timeAgo(c.at)}</span>
            {c.fairness && (
              <span className={cn("rounded-full px-2 py-0.5 font-bold", c.fairness === "juste" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>
                {FAIRNESS[c.fairness as keyof typeof FAIRNESS] ?? c.fairness}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-800">« {c.text} »</p>
        </li>
      ))}
    </ul>
  );
}

/* ---------- IA ---------- */

function BudgetGauge({ data }: { data: DashboardData }) {
  const { today, budgetUsd } = data.ai;
  const percent = budgetUsd ? (today.costUsd / budgetUsd) * 100 : 0;
  const color = percent >= 90 ? STATUS.critical : percent >= 60 ? STATUS.warning : STATUS.good;
  return (
    <div>
      <p className="text-3xl font-bold tracking-tight text-slate-900">
        <AnimatedNumber value={today.costUsd} format={formatUsd} />
        <span className="ml-2 text-base font-medium text-slate-500">sur {formatUsd(budgetUsd)}</span>
      </p>
      <div className="mt-3">
        <GrowBar percent={percent} color={color} height={12} label={`${Math.round(percent)} % du budget du jour`} />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {Math.round(percent)} % du budget du jour · {today.calls} appel{today.calls > 1 ? "s" : ""}. Au-delà du budget, l&apos;IA se met en pause jusqu&apos;au lendemain.
      </p>
    </div>
  );
}

function Ai({ data }: { data: DashboardData }) {
  const max = Math.max(0, ...data.ai.byFeature.map((f) => f.costUsd));
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-1 text-sm font-medium text-slate-600">Aujourd&apos;hui</p>
          <BudgetGauge data={data} />
        </div>
        <KpiTile label="Coût sur la période" trend={data.kpis.aiCost} format={formatUsd} upIsGood={false} />
        <KpiTile label="Appels sur la période" trend={data.ai.calls} color={SERIES[1]} />
      </div>
      <Panel title="Coût par jour" hint="La ligne rouge marque le budget quotidien (variable AI_DAILY_BUDGET_USD sur Vercel).">
        <DailyBars days={data.days} values={data.ai.daily} format={(v) => `${v.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} $`} reference={{ value: data.ai.budgetUsd, label: `Budget ${formatUsd(data.ai.budgetUsd)}` }} />
      </Panel>
      <Panel title="Par fonctionnalité">
        {data.ai.byFeature.length === 0 ? (
          <Empty>Aucun appel à l&apos;IA sur cette période.</Empty>
        ) : (
          <ul className="space-y-3">
            {data.ai.byFeature.map((f) => (
              <li key={f.feature}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-900">{f.feature}</span>
                  <span className="text-slate-600">
                    {f.calls} appel{f.calls > 1 ? "s" : ""} · <strong className="text-slate-900">{formatUsd(f.costUsd)}</strong>
                  </span>
                </div>
                <GrowBar percent={max ? (f.costUsd / max) * 100 : 0} color={SERIES[0]} height={8} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

/* ---------- Catalogue ---------- */

function Catalogue({ health }: { health: DashboardData["health"] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <HealthPanel title="Fiches à revérifier" items={health.formations} empty="Toutes les fiches ont été vérifiées il y a moins de 5 mois." />
      <HealthPanel title="Calendriers à mettre à jour" items={health.campaigns} empty="Tous les calendriers concernent la prochaine rentrée." />
      <HealthPanel title="Frais à mettre à jour" items={health.fees} empty="Tous les frais concernent l'année universitaire en cours." />
    </div>
  );
}

function HealthPanel({ title, items, empty }: { title: string; items: HealthItem[]; empty: string }) {
  return (
    <Panel
      title={title}
      action={
        <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-bold", items.length ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800")}>
          {items.length ? items.length : "✓"}
        </span>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-slate-600">{empty}</p>
      ) : (
        <ul className="max-h-96 space-y-2 overflow-y-auto pr-1 text-sm">
          {items.map((item) => (
            <li key={item.id} className={cn("rounded-xl border-l-4 bg-slate-50 px-3 py-2", item.overdue ? "border-red-500" : "border-amber-400")}>
              <span className="font-medium text-slate-900">{item.label}</span>
              <span className="block text-xs text-slate-600">{item.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ---------- Gestion ---------- */

function Management({ data, email }: { data: DashboardData; email: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Supprimer un compte" hint="Droit à l'effacement, à la demande d'un étudiant : supprime le compte, son profil et son projet synchronisé. Irréversible.">
        <AccountDeletionForm />
      </Panel>
      <Panel title="Journal des actions" hint={`Connecté en tant que ${email}. Les 30 dernières actions.`}>
        {data.audit.length === 0 ? (
          <Empty>{data.actionsReady ? "Aucune action pour l'instant." : "Journal disponible après la migration 0010."}</Empty>
        ) : (
          <ol className="relative space-y-4 border-l border-slate-200 pl-5">
            {data.audit.map((a, i) => (
              <li key={`${a.created_at}-${i}`} className="relative">
                <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full bg-blue-600 ring-4 ring-white" aria-hidden />
                <p className="text-xs text-slate-500">
                  {new Date(a.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })} · {a.admin_email}
                </p>
                <p className="text-sm text-slate-900">
                  <strong>{a.action}</strong> {a.detail}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
