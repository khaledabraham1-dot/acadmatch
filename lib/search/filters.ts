import type { Formation } from "@/types";
import { normalize } from "@/lib/utils";

/** Valeurs "aucun filtre" des sélecteurs de la page recherche — affichées comme option par défaut. */
export const ALL_LEVELS = "Tous les niveaux";
export const ALL_DOMAINS = "Tous les domaines";
export const ALL_CITIES = "Toutes les villes";
export const ALL_LANGUAGES = "Toutes les langues";

export interface SearchFilters {
  query: string;
  level: string;
  domain: string;
  city: string;
  language: string;
}

export const EMPTY_FILTERS: SearchFilters = {
  query: "",
  level: ALL_LEVELS,
  domain: ALL_DOMAINS,
  city: ALL_CITIES,
  language: ALL_LANGUAGES,
};

/**
 * Une formation correspond-elle aux filtres de recherche ? Logique pure
 * (testable indépendamment de la page) — voir lib/search/filters.test.ts.
 */
export function matchesFilters(formation: Formation, filters: SearchFilters): boolean {
  const q = normalize(filters.query);
  const matchesQuery =
    q.length === 0 ||
    normalize(formation.name).includes(q) ||
    normalize(formation.institution).includes(q) ||
    normalize(formation.field).includes(q);
  const matchesLevel = filters.level === ALL_LEVELS || formation.level === filters.level;
  const matchesDomain = filters.domain === ALL_DOMAINS || formation.field === filters.domain;
  const matchesCity = filters.city === ALL_CITIES || formation.city === filters.city;
  const matchesLanguage = filters.language === ALL_LANGUAGES || formation.language === filters.language;
  return matchesQuery && matchesLevel && matchesDomain && matchesCity && matchesLanguage;
}

export function filterFormations(formations: Formation[], filters: SearchFilters): Formation[] {
  return formations.filter((formation) => matchesFilters(formation, filters));
}

/** Valeurs uniques d'un champ du catalogue, triées — pour peupler les options d'un filtre. */
export function uniqueSorted(formations: Formation[], selector: (formation: Formation) => string): string[] {
  return [...new Set(formations.map(selector))].sort();
}
