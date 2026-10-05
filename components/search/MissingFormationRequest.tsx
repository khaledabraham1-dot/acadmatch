"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { loadProfile } from "@/lib/storage";
import {
  flushPendingFormationRequests,
  isValidRequest,
  MAX_INSTITUTION_LENGTH,
  MAX_WANTED_LENGTH,
  REQUEST_COUNTRIES,
  sendFormationRequest,
  type RequestCountry,
  type RequestSource,
} from "@/lib/formationRequests";
import { cn } from "@/lib/utils";

interface MissingFormationRequestProps {
  source: RequestSource;
  /** Recherche en cours : envoyée avec la demande et proposée comme point de départ. */
  searchQuery?: string;
  /** Formulaire déplié d'emblée (recherche sans résultat). */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * « Votre formation n'est pas dans le catalogue ? » — l'étudiant la signale
 * en une phrase, anonymement (lib/formationRequests.ts). Ces demandes
 * décident des prochaines fiches ajoutées.
 */
export function MissingFormationRequest({ source, searchQuery = "", defaultOpen = false, className }: MissingFormationRequestProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  // null : pas encore modifiée, la demande suit la recherche en cours.
  const [edited, setEdited] = useState<string | null>(null);
  const wanted = edited ?? searchQuery;
  const [institution, setInstitution] = useState("");
  const [country, setCountry] = useState<RequestCountry | "">("");
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<"sent" | "queued" | null>(null);

  // Renvoie les demandes restées en attente (réseau coupé lors d'une visite précédente).
  useEffect(() => {
    void flushPendingFormationRequests();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValidRequest(wanted) || sending) return;
    setSending(true);
    const profile = loadProfile();
    const result = await sendFormationRequest({
      wanted,
      institution,
      country: country || null,
      source,
      searchQuery: searchQuery || null,
      profileField: profile?.fieldOfStudy ?? null,
      profileLevel: profile?.currentLevel ?? null,
      profileGoal: profile?.goal ?? null,
    });
    setSending(false);
    setOutcome(result);
  }

  const box = "rounded-2xl border border-dashed border-slate-300 bg-white p-5";

  if (outcome) {
    return (
      <div className={cn("rounded-2xl border border-blue-100 bg-blue-50/60 p-5", className)} role="status">
        <p className="text-sm font-bold text-slate-900">
          {outcome === "sent" ? "Merci, votre demande est envoyée." : "Merci : votre demande sera envoyée dès que la connexion le permettra."}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Les formations les plus demandées sont ajoutées en priorité, avec leurs prérequis vérifiés sur les pages officielles.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className={cn(box, "flex flex-wrap items-center justify-between gap-3", className)}>
        <p className="flex items-center gap-2 text-sm text-slate-700">
          <SearchX className="size-4 shrink-0 text-slate-500" aria-hidden />
          Votre formation n&apos;est pas dans le catalogue ?
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Signaler une formation manquante
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn(box, "space-y-4", className)}>
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <SearchX className="size-4 text-slate-500" aria-hidden />
          Quelle formation cherchez-vous ?
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Le catalogue grandit d&apos;après les demandes des étudiants : dites-nous laquelle ajouter.
        </p>
      </div>
      <div>
        <Label htmlFor={`${id}-wanted`}>Formation souhaitée</Label>
        <Input
          id={`${id}-wanted`}
          value={wanted}
          onChange={(e) => setEdited(e.target.value)}
          maxLength={MAX_WANTED_LENGTH}
          required
          placeholder="Ex. : Master Économie du développement"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <div>
          <Label htmlFor={`${id}-institution`}>Établissement ou ville (optionnel)</Label>
          <Input
            id={`${id}-institution`}
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            maxLength={MAX_INSTITUTION_LENGTH}
            placeholder="Ex. : Université Clermont Auvergne"
          />
        </div>
        <div>
          <Label htmlFor={`${id}-country`}>Pays (optionnel)</Label>
          <Select id={`${id}-country`} value={country} onChange={(e) => setCountry(e.target.value as RequestCountry | "")}>
            <option value="">Non précisé</option>
            {REQUEST_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c === "Autre" ? "Autre pays" : c}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!isValidRequest(wanted) || sending}>
          {sending ? "Envoi…" : "Envoyer ma demande"}
        </Button>
        {!defaultOpen && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Annuler
          </Button>
        )}
      </div>
      <p className="text-xs text-slate-600">
        Demande anonyme : ni nom, ni e-mail, ni compte. Seuls votre recherche et le domaine, le niveau et le diplôme
        visé de votre profil l&apos;accompagnent.
      </p>
    </form>
  );
}
