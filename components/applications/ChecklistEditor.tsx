"use client";

import { useState } from "react";
import { CalendarDays, ExternalLink, Plus, Sparkles, X } from "lucide-react";
import type { ChecklistItem } from "@/types";
import type { DocumentSuggestionSet } from "@/data/documentSuggestions";
import { Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface ChecklistEditorProps {
  items: ChecklistItem[];
  placeholder: string;
  emptyLabel: string;
  onAdd: (label: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  /** Rappel personnel (Phase 14) — apparaît sur /calendrier s'il est renseigné. */
  onSetDueDate: (id: string, date: string | undefined) => void;
  /** Obligatoire/optionnel (Phase 15) — bascule libre, appréciation de l'étudiant sur son propre élément. */
  onToggleRequired: (id: string) => void;
  /** Suggestion officielle sourcée (Phase 15), proposée seulement quand honnêtement applicable à cette formation. */
  suggestion?: DocumentSuggestionSet;
  onAddSuggestion?: () => void;
}

/**
 * Liste à cocher libre, réutilisée pour les documents et les prochaines
 * actions d'une candidature (Phase 13) — même pattern d'ajout/coche/retrait
 * pour les deux, une seule implémentation. `source` (Phase 15), quand
 * renseigné, vient toujours d'une suggestion officielle sourcée
 * (data/documentSuggestions.ts) — jamais saisi librement par l'étudiant.
 */
export function ChecklistEditor({
  items,
  placeholder,
  emptyLabel,
  onAdd,
  onToggle,
  onRemove,
  onSetDueDate,
  onToggleRequired,
  suggestion,
  onAddSuggestion,
}: ChecklistEditorProps) {
  const [draft, setDraft] = useState("");

  function handleAdd() {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  }

  return (
    <div>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id} className="group text-sm">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => onToggle(item.id)}
                  className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
                <span className={cn("min-w-0 flex-1 text-slate-700", item.done && "text-slate-400 line-through")}>
                  {item.label}
                  {item.source && (
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Source officielle de cette suggestion"
                      className="ml-1 inline-flex align-middle text-slate-400 hover:text-blue-600"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Retirer « ${item.label} »`}
                  className="shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-500 group-hover:opacity-100 focus:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 pl-6">
                <button
                  type="button"
                  onClick={() => onToggleRequired(item.id)}
                  className="shrink-0"
                  aria-label={item.required ? "Marquer comme optionnel" : "Marquer comme obligatoire"}
                >
                  <Badge tone={item.required ? "warning" : "neutral"}>
                    {item.required ? "Obligatoire" : "Optionnel"}
                  </Badge>
                </button>
                <label className="flex shrink-0 items-center gap-1 text-slate-400">
                  <CalendarDays className="size-3.5" aria-hidden />
                  <input
                    type="date"
                    value={item.dueDate ?? ""}
                    onChange={(e) => onSetDueDate(item.id, e.target.value || undefined)}
                    aria-label={`Rappel personnel pour « ${item.label} »`}
                    className="w-[118px] rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-slate-500 hover:border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">{emptyLabel}</p>
      )}
      {suggestion && onAddSuggestion && (
        <button
          type="button"
          onClick={onAddSuggestion}
          title={suggestion.description}
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-blue-200 bg-blue-50/60 px-2.5 py-1.5 text-left text-xs font-medium text-blue-700 hover:bg-blue-50"
        >
          <Sparkles className="size-3.5 shrink-0" />
          Ajouter les suggestions officielles : {suggestion.title}
        </button>
      )}
      <div className="mt-2 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim()}
          aria-label="Ajouter"
          className="shrink-0 rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
