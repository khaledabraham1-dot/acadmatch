"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { KeyRound, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Hint, Input, Label } from "@/components/ui/Field";
import { safeInternalPath } from "@/lib/profile/validation";
import { isValidOtpCode, normalizeOtpCode } from "@/lib/auth/otp";

type Step = "email" | "code";
type Status = "idle" | "busy" | "error";

/**
 * Connexion sans mot de passe (2026-10-06) : une seule action pour se
 * connecter ou créer son compte. Supabase envoie un e-mail contenant à la
 * fois un lien et un code à 6 chiffres : le code permet de se connecter sur
 * l'ordinateur quand on lit ses e-mails sur son téléphone (et inversement).
 * Google en option, affiché seulement quand le fournisseur est configuré
 * (NEXT_PUBLIC_AUTH_GOOGLE=1, voir docs/mise-en-ligne.md).
 */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";

  // `?next=` : revenir là où l'étudiant a demandé à se connecter (import de documents, admin…).
  const nextPath = () => safeInternalPath(new URLSearchParams(window.location.search).get("next"), "/compte");
  const callbackUrl = () => `${window.location.origin}/auth/confirm?next=${encodeURIComponent(nextPath())}`;

  async function sendEmail(event?: FormEvent) {
    event?.preventDefault();
    setStatus("busy");
    setError("");
    const { error: sendError } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl() },
    });
    if (sendError) {
      setStatus("error");
      setError(
        sendError.status === 429
          ? "Trop de demandes en peu de temps. Patientez une minute avant de redemander un e-mail."
          : "L'e-mail n'a pas pu être envoyé. Vérifiez l'adresse et réessayez.",
      );
      return;
    }
    setStatus("idle");
    setStep("code");
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    const token = normalizeOtpCode(code);
    if (!isValidOtpCode(token)) {
      setStatus("error");
      setError("Le code contient 6 chiffres.");
      return;
    }
    setStatus("busy");
    setError("");
    const { error: verifyError } = await createClient().auth.verifyOtp({ email: email.trim(), token, type: "email" });
    if (verifyError) {
      setStatus("error");
      setError("Code incorrect ou expiré. Vérifiez-le, ou demandez un nouvel e-mail.");
      return;
    }
    // Rechargement complet : les pages serveur (admin, compte) lisent la nouvelle session.
    window.location.assign(nextPath());
  }

  async function signInWithGoogle() {
    setStatus("busy");
    setError("");
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (oauthError) {
      setStatus("error");
      setError("La connexion avec Google n'a pas abouti. Réessayez ou utilisez votre e-mail.");
    }
  }

  if (step === "code") {
    return (
      <Card>
        <h2 className="text-base font-semibold text-slate-900">Vérifiez votre boîte mail</h2>
        <p className="mt-2 text-sm text-slate-600">
          Nous avons envoyé un e-mail à <strong>{email.trim()}</strong>. Cliquez sur le lien qu&apos;il contient,
          ou saisissez ici le code à 6 chiffres. Pensez à regarder dans les indésirables.
        </p>
        <form onSubmit={verifyCode} className="mt-4 space-y-3">
          <div>
            <Label htmlFor="login-code">Code reçu par e-mail</Label>
            <Input
              id="login-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={11}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="max-w-[12rem] text-lg tracking-[0.3em]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={status === "busy"}>
              <KeyRound className="size-4" aria-hidden />
              {status === "busy" ? "Vérification…" : "Se connecter"}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={status === "busy"} onClick={() => void sendEmail()}>
              Renvoyer l&apos;e-mail
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setStep("email"); setCode(""); setStatus("idle"); setError(""); }}>
              Changer d&apos;adresse
            </Button>
          </div>
          {status === "error" && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900">Se connecter ou créer un compte</h2>
      <p className="mt-1 text-sm text-slate-600">
        Une seule étape : saisissez votre e-mail. Si vous n&apos;avez pas encore de compte, il est créé
        automatiquement, sans mot de passe. Le compte est optionnel : il sauvegarde votre projet (profil,
        candidatures, lettres, budget) et vous le retrouvez sur tous vos appareils.
      </p>

      {googleEnabled && (
        <div className="mt-4 space-y-3">
          <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={status === "busy"} onClick={() => void signInWithGoogle()}>
            <GoogleMark />
            Continuer avec Google
          </Button>
          <p className="flex items-center gap-3 text-xs text-slate-600" aria-hidden>
            <span className="h-px flex-1 bg-slate-200" />
            ou avec votre e-mail
            <span className="h-px flex-1 bg-slate-200" />
          </p>
        </div>
      )}

      <form onSubmit={sendEmail} className="mt-4 space-y-3">
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
        <Button type="submit" disabled={status === "busy"}>
          <Mail className="size-4" aria-hidden />
          {status === "busy" ? "Envoi en cours…" : "Continuer"}
        </Button>
        {status === "error" && <Hint>{error}</Hint>}
        <p className="text-xs leading-relaxed text-slate-600">
          Vous recevrez un e-mail avec un lien et un code de connexion. En créant un compte, vous acceptez les{" "}
          <Link href="/conditions" className="underline underline-offset-2 hover:text-slate-800">
            conditions d&apos;utilisation
          </Link>
          . Votre e-mail sert uniquement à vous connecter ;{" "}
          <Link href="/confidentialite" className="underline underline-offset-2 hover:text-slate-800">
            confidentialité
          </Link>
          .
        </p>
      </form>
    </Card>
  );
}

/** Logo « G » de Google (couleurs officielles), décoratif : le texte du bouton porte le sens. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
