"use client";

import { useId, useState } from "react";
import { isLanguageTerm, isRecognizedTerm } from "@/lib/matching/vocabulary";
import { Chip, SuggestionChip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Field";
import { Plus } from "lucide-react";

interface CourseSkillEditorProps {
  label: string;
  hint?: string;
  items: string[];
  suggestions: string[];
  placeholder: string;
  /** Vocabulaire reconnu par le catalogue, proposé en autocomplétion à la frappe. */
  vocabulary?: string[];
  onChange: (items: string[]) => void;
}

/** Suggestions visibles avant « Voir plus ». */
const VISIBLE_SUGGESTIONS = 10;

/** Éditeur de liste (matières ou compétences) : suggestions rapides + ajout manuel. */
export function CourseSkillEditor({ label, hint, items, suggestions, placeholder, vocabulary, onChange }: CourseSkillEditorProps) {
  const [draft, setDraft] = useState("");
  const [showAll, setShowAll] = useState(false);
  const inputId = useId();
  const listId = useId();

  function addItem(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (items.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...items, trimmed]);
  }

  function removeItem(value: string) {
    onChange(items.filter((item) => item !== value));
  }

  function handleAdd() {
    addItem(draft);
    setDraft("");
  }

  // Libellés qui ne comptent pas dans le score (lib/matching/vocabulary.ts) :
  // on le dit tout de suite, plutôt que de laisser croire qu'ils pèsent.
  const unrecognized = items.filter((item) => !isRecognizedTerm(item) && !isLanguageTerm(item));
  const languages = items.filter(isLanguageTerm);

  const remainingSuggestions = suggestions.filter(
    (s) => !items.some((item) => item.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {hint && <p className="mb-2.5 text-xs text-slate-500">{hint}</p>}

      {items.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <Chip
              key={item}
              onRemove={() => removeItem(item)}
              className={unrecognized.includes(item) || languages.includes(item) ? "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-300" : undefined}
            >
              {item}
            </Chip>
          ))}
        </div>
      )}
      {unrecognized.length > 0 && (
        <p role="status" className="mb-3 text-xs leading-relaxed text-amber-800">
          Non reconnu{unrecognized.length > 1 ? "s" : ""} comme matière ou compétence : {unrecognized.map((u) => `« ${u} »`).join(", ")}.{" "}
          {unrecognized.length > 1 ? "Ils ne comptent" : "Il ne compte"} pas dans le score. Vérifiez l&apos;intitulé ou choisissez une suggestion.
        </p>
      )}
      {languages.length > 0 && (
        <p role="status" className="mb-3 text-xs leading-relaxed text-amber-800">
          {languages.map((l) => `« ${l} »`).join(", ")} : une langue ne compte pas comme matière ou compétence.
          Cochez-la plutôt dans les langues de cours, plus haut.
        </p>
      )}

      {/*
        Un simple <div> plutôt qu'un <form> : ce composant est toujours utilisé à
        l'intérieur du <form> de la page profil, et le HTML interdit d'imbriquer
        des formulaires (cela provoquerait une erreur d'hydratation React).
      */}
      <div className="mb-3 flex gap-2">
        <Input
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            handleAdd();
          }}
          placeholder={placeholder}
          list={vocabulary?.length ? listId : undefined}
          autoComplete="off"
        />
        {vocabulary && vocabulary.length > 0 && (
          <datalist id={listId}>
            {vocabulary.map((word) => (
              <option key={word} value={word} />
            ))}
          </datalist>
        )}
        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Ajouter (${label})`}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Plus className="size-4" />
          Ajouter
        </button>
      </div>

      {remainingSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {(showAll ? remainingSuggestions : remainingSuggestions.slice(0, VISIBLE_SUGGESTIONS)).map((s) => (
            <SuggestionChip key={s} onClick={() => addItem(s)}>
              {s}
            </SuggestionChip>
          ))}
          {remainingSuggestions.length > VISIBLE_SUGGESTIONS && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="px-2 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {showAll ? "Voir moins" : `Voir plus (${remainingSuggestions.length - VISIBLE_SUGGESTIONS})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
