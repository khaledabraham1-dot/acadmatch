"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Card } from "@/components/ui/Card";
import { PasswordForm } from "@/components/account/PasswordForm";

/** Après le lien « mot de passe oublié » : la session du lien permet de choisir le nouveau mot de passe. */
export function NewPasswordPanel() {
  const [state, setState] = useState<"loading" | "ready" | "expired" | "done">(isSupabaseConfigured() ? "loading" : "expired");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    createClient()
      .auth.getUser()
      .then(({ data }) => setState(data.user ? "ready" : "expired"));
  }, []);

  if (state === "loading") return null;
  return (
    <Card>
      {state === "expired" && (
        <p className="text-sm text-slate-700">
          Ce lien a expiré ou a été ouvert dans un autre navigateur.{" "}
          <Link href="/compte" className="font-semibold text-blue-700 hover:underline">
            Redemandez un lien
          </Link>{" "}
          avec « Mot de passe oublié ».
        </p>
      )}
      {state === "ready" && <PasswordForm submitLabel="Choisir ce mot de passe" onDone={() => setState("done")} />}
      {state === "done" && (
        <p role="status" className="text-sm text-slate-700">
          Mot de passe enregistré, vous êtes connecté.{" "}
          <Link href="/compte" className="font-semibold text-blue-700 hover:underline">
            Aller à mon compte
          </Link>
        </p>
      )}
    </Card>
  );
}
