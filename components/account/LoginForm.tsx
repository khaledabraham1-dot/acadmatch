"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Hint, Input, Label } from "@/components/ui/Field";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Connexion par lien magique uniquement (pas de mot de passe) : aucune
 * gestion de hachage ni de flux "mot de passe oublié" à sécuriser — la
 * connexion EST déjà le flux de récupération. Voir la discussion Phase 5
 * avec Khaled et docs/accounts-setup.md.
 */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/compte` },
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <Card>
        <h2 className="text-base font-semibold text-slate-900">Vérifiez votre boîte mail</h2>
        <p className="mt-2 text-sm text-slate-600">
          Un lien de connexion a été envoyé à <strong>{email}</strong>. Cliquez dessus pour vous
          connecter — il expire après un court délai.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900">Se connecter</h2>
      <p className="mt-1 text-sm text-slate-500">
        Optionnel : un compte permet de retrouver votre profil sur un autre appareil. AcadMatch
        fonctionne entièrement sans compte, comme aujourd&apos;hui.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <Label htmlFor="login-email">Adresse e-mail</Label>
          <Input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={status === "sending"}>
          <Mail className="size-4" aria-hidden />
          {status === "sending" ? "Envoi en cours…" : "Recevoir un lien de connexion"}
        </Button>
        {status === "error" && (
          <Hint>Une erreur est survenue. Vérifiez l&apos;adresse et réessayez.</Hint>
        )}
      </form>
    </Card>
  );
}
