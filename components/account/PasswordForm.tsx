"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Field";
import { PasswordInput } from "@/components/account/PasswordInput";
import { authErrorMessage, passwordProblem, PASSWORD_MIN_LENGTH } from "@/lib/auth/password";

/**
 * Choisir ou changer son mot de passe, une fois connecté (2026-10-07) : sert
 * après « mot de passe oublié » et aux comptes créés avant les mots de passe
 * (connexion par code), qui peuvent en ajouter un depuis /compte.
 */
export function PasswordForm({ onDone, submitLabel = "Enregistrer le mot de passe" }: { onDone?: () => void; submitLabel?: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const problem = passwordProblem(password, confirmation);
    if (problem) {
      setMessage({ ok: false, text: problem });
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage({ ok: false, text: authErrorMessage(error, "update") });
      return;
    }
    setPassword("");
    setConfirmation("");
    setMessage({ ok: true, text: "Mot de passe enregistré. Vous pourrez l'utiliser à votre prochaine connexion." });
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="new-password">Nouveau mot de passe</Label>
          <PasswordInput id="new-password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="new-password-confirmation">Confirmez-le</Label>
          <PasswordInput id="new-password-confirmation" required autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-slate-600">Au moins {PASSWORD_MIN_LENGTH} caractères, avec au moins une lettre et un chiffre.</p>
      <Button type="submit" disabled={busy}>
        <KeyRound className="size-4" aria-hidden />
        {busy ? "Enregistrement…" : submitLabel}
      </Button>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm font-medium text-emerald-800" : "text-sm font-medium text-red-700"}>
          {message.text}
        </p>
      )}
    </form>
  );
}
