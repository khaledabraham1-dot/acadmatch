"use client";

import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { FormationCard } from "@/components/search/FormationCard";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { Input, Select } from "@/components/ui/Field";
import { LinkButton } from "@/components/ui/Button";
import { FORMATIONS } from "@/data/formations";
import { ACADEMIC_LEVEL_ORDER, type StudentProfile } from "@/types";
import { loadProfile } from "@/lib/storage";
import { computeCompatibility } from "@/lib/matching/engine";
import { compareFormationsByGoalThenScore } from "@/lib/matching/ranking";
import {
  ALL_CITIES,
  ALL_DOMAINS,
  ALL_LANGUAGES,
  ALL_LEVELS,
  filterFormations,
  uniqueSorted,
} from "@/lib/search/filters";

// Dérivés du catalogue réel (pas des référentiels complets de data/subjects.ts) :
// proposer un domaine, niveau, ville ou langue qui ne correspond à aucune
// formation mènerait systématiquement à "Aucune formation ne correspond".
const AVAILABLE_DOMAINS = uniqueSorted(FORMATIONS, (f) => f.field);
const AVAILABLE_LEVELS = ACADEMIC_LEVEL_ORDER.filter((l) => FORMATIONS.some((f) => f.level === l));
const AVAILABLE_CITIES = uniqueSorted(FORMATIONS, (f) => f.city);
const AVAILABLE_LANGUAGES = uniqueSorted(FORMATIONS, (f) => f.language);

export default function RecherchePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState(ALL_LEVELS);
  const [domain, setDomain] = useState(ALL_DOMAINS);
  const [city, setCity] = useState(ALL_CITIES);
  const [language, setLanguage] = useState(ALL_LANGUAGES);

  useEffect(() => {
    // localStorage n'existe pas côté serveur : la lecture doit se faire après le montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
  }, []);

  function resetFilters() {
    setQuery("");
    setLevel(ALL_LEVELS);
    setDomain(ALL_DOMAINS);
    setCity(ALL_CITIES);
    setLanguage(ALL_LANGUAGES);
  }

  const scores = useMemo(() => {
    if (!profile) return new Map<string, number>();
    return new Map(
      FORMATIONS.map((formation) => [formation.id, computeCompatibility(profile, formation).overallScore]),
    );
  }, [profile]);

  const filtered = useMemo(() => {
    return filterFormations(FORMATIONS, { query, level, domain, city, language }).sort((a, b) =>
      compareFormationsByGoalThenScore(a, b, profile, (f) => scores.get(f.id) ?? -1),
    );
  }, [query, level, domain, city, language, scores, profile]);

  return (
    <AppShell
      title="Rechercher une formation"
      description="Trouvez la formation française qui correspond à votre parcours."
    >
      {FORMATIONS.some((f) => f.demo) && (
        <div className="mb-6">
          <DemoDataBadge />
        </div>
      )}

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

      <div className="mb-6 space-y-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une formation, un établissement..."
            className="pl-10"
          />
        </div>
        {/*
          flex-wrap plutôt qu'une grille à colonnes fixes : la somme des
          largeurs des <Select> peut dépasser la largeur disponible entre sm
          et lg (débordement horizontal déjà constaté à ~900px sur 2
          filtres) — avec 4 filtres, le wrap est d'autant plus nécessaire.
        */}
        <div className="flex flex-wrap gap-3">
          <Select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full sm:w-44">
            <option>{ALL_LEVELS}</option>
            {AVAILABLE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <Select value={domain} onChange={(e) => setDomain(e.target.value)} className="w-full sm:w-56">
            <option>{ALL_DOMAINS}</option>
            {AVAILABLE_DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <Select value={city} onChange={(e) => setCity(e.target.value)} className="w-full sm:w-40">
            <option>{ALL_CITIES}</option>
            {AVAILABLE_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full sm:w-44">
            <option>{ALL_LANGUAGES}</option>
            {AVAILABLE_LANGUAGES.map((lg) => (
              <option key={lg} value={lg}>
                {lg}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-400">
        {filtered.length} formation{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}
      </p>

      <div className="space-y-4">
        {filtered.map((formation) => (
          <FormationCard key={formation.id} formation={formation} score={scores.get(formation.id) ?? null} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-400">Aucune formation ne correspond à votre recherche.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
