"use client";

import { useState } from "react";
import { CalendarDays, Plus, X } from "lucide-react";
import type { ChecklistItem } from "@/types";
import { Input } from "@/components/ui/Field";
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
}

/**
 * Liste à cocher libre, réutilisée pour les documents et les prochaines
 * actions d'une candidature (Phase 13) — même pattern d'ajout/coche/retrait
 * pour les deux, une seule implémentation.
 */
export function ChecklistEditor({
  items,
  placeholder,
  emptyLabel,
  onAdd,
  onToggle,
  onRemove,
  onSetDueDate,
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
            <li key={item.id} className="group flex flex-wrap items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggle(item.id)}
                className="size-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
              <span className={cn("min-w-0 flex-1 text-slate-700", item.done && "text-slate-400 line-through")}>
                {item.label}
              </span>
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
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={`Retirer « ${item.label} »`}
                className="shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-500 group-hover:opacity-100 focus:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">{emptyLabel}</p>
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
