"use client";

import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { FormationCard } from "@/components/search/FormationCard";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { Input, Select } from "@/components/ui/Field";
import { LinkButton } from "@/components/ui/Button";
import { FORMATIONS } from "@/data/formations";
import { DOMAINS } from "@/data/subjects";
import { ACADEMIC_LEVEL_ORDER, type StudentProfile } from "@/types";
import { loadProfile } from "@/lib/storage";
import { computeCompatibility } from "@/lib/matching/engine";
import { normalize } from "@/lib/utils";

export default function RecherchePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("Tous les niveaux");
  const [domain, setDomain] = useState("Tous les domaines");

  useEffect(() => {
    // localStorage n'existe pas côté serveur : la lecture doit se faire après le montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
  }, []);

  const scores = useMemo(() => {
    if (!profile) return new Map<string, number>();
    return new Map(
      FORMATIONS.map((formation) => [formation.id, computeCompatibility(profile, formation).overallScore]),
    );
  }, [profile]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return FORMATIONS.filter((formation) => {
      const matchesQuery =
        q.length === 0 ||
        normalize(formation.name).includes(q) ||
        normalize(formation.institution).includes(q) ||
        normalize(formation.field).includes(q);
      const matchesLevel = level === "Tous les niveaux" || formation.level === level;
      const matchesDomain = domain === "Tous les domaines" || formation.field === domain;
      return matchesQuery && matchesLevel && matchesDomain;
    }).sort((a, b) => {
      // Formations les plus compatibles en premier lorsqu'un profil existe.
      const scoreA = scores.get(a.id) ?? -1;
      const scoreB = scores.get(b.id) ?? -1;
      return scoreB - scoreA;
    });
  }, [query, level, domain, scores]);

  return (
    <AppShell
      title="Rechercher une formation"
      description="Trouvez la formation française qui correspond à votre parcours."
    >
      <div className="mb-6">
        <DemoDataBadge />
      </div>

      {!profile && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
          <p className="text-sm text-blue-800">
            Renseignez votre profil académique pour voir votre compatibilité avec chaque formation.
          </p>
          <LinkButton href="/profil?next=/recherche" size="sm">
            Analyser mon profil
            <ArrowRight className="size-3.5" />
          </LinkButton>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une formation, un établissement..."
            className="pl-10"
          />
        </div>
        <Select value={level} onChange={(e) => setLevel(e.target.value)} className="sm:w-48">
          <option>Tous les niveaux</option>
          {ACADEMIC_LEVEL_ORDER.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
        <Select value={domain} onChange={(e) => setDomain(e.target.value)} className="sm:w-56">
          <option>Tous les domaines</option>
          {DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </div>

      <p className="mb-4 text-sm text-slate-400">
        {filtered.length} formation{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}
      </p>

      <div className="space-y-4">
        {filtered.map((formation) => (
          <FormationCard key={formation.id} formation={formation} score={scores.get(formation.id) ?? null} />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            Aucune formation ne correspond à votre recherche.
          </p>
        )}
      </div>
    </AppShell>
  );
}
