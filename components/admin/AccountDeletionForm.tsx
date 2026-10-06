"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { deleteAccountByEmail, type DeletionState } from "@/app/admin/actions";

const INITIAL: DeletionState = { ok: false, message: "" };

/** Droit à l'effacement : supprime le compte d'un étudiant qui en fait la demande par e-mail. */
export function AccountDeletionForm() {
  const [state, action, pending] = useActionState(deleteAccountByEmail, INITIAL);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="delete-email">Adresse du compte à supprimer</Label>
          <Input id="delete-email" name="email" type="email" required autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="delete-confirmation">Confirmez l&apos;adresse</Label>
          <Input id="delete-confirmation" name="confirmation" type="email" required autoComplete="off" />
        </div>
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        <Trash2 className="size-4" aria-hidden />
        {pending ? "Suppression…" : "Supprimer définitivement ce compte"}
      </Button>
      {state.message && (
        <p role="status" className={state.ok ? "text-sm font-medium text-emerald-800" : "text-sm font-medium text-red-700"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
