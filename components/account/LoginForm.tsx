"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { KeyRound, LogIn, Mail, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { PasswordInput } from "@/components/account/PasswordInput";
import { safeInternalPath } from "@/lib/profile/validation";
import { isValidOtpCode, normalizeOtpCode } from "@/lib/auth/otp";
import { authErrorMessage, passwordProblem, PASSWORD_MIN_LENGTH } from "@/lib/auth/password";

/**
 * Connexion (2026-10-07) : e-mail + mot de passe par défaut, comme partout
 * ailleurs, avec création de compte et « mot de passe oublié ». Le code reçu
 * par e-mail reste proposé en second choix (pratique sur un téléphone, ou
 * pour un compte créé avant les mots de passe). Google en option, affiché
 * seulement quand le fournisseur est configuré (NEXT_PUBLIC_AUTH_GOOGLE=1).
 */
interface LoginFormProps {
  /** Adresse imposée (reconfirmation d'identité de l'admin) : le champ n'est pas modifiable. */
  presetEmail?: string;
  title?: string;
  intro?: string;
  /** Page après connexion ; par défaut, le paramètre ?next= ou /compte. */
  afterLogin?: string;
  /** Masque la création de compte (connexion à l'espace admin). */
  signInOnly?: boolean;
}

type Mode = "signin" | "signup" | "forgot" | "code";
type Screen = { kind: "form" } | { kind: "code-sent" } | { kind: "info"; title: string; text: string };

export function LoginForm({ presetEmail, title, intro, afterLogin, signInOnly }: LoginFormProps = {}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [screen, setScreen] = useState<Screen>({ kind: "form" });
  const [email, setEmail] = useState(presetEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";

  // `?next=` : revenir là où l'étudiant a demandé à se connecter (import de documents…).
  const nextPath = () => safeInternalPath(afterLogin ?? new URLSearchParams(window.location.search).get("next"), "/compte");
  const callbackUrl = (next = nextPath()) => `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;
  // Rechargement complet : les pages serveur (compte, admin) lisent la nouvelle session.
  const done = () => window.location.assign(nextPath());

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setPassword("");
    setConfirmation("");
  }

  async function run(task: () => Promise<string | null>) {
    setBusy(true);
    setError("");
    const problem = await task();
    setBusy(false);
    if (problem) setError(problem);
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    const auth = createClient().auth;
    void run(async () => {
      if (mode === "signin") {
        const { error: e } = await auth.signInWithPassword({ email: address, password });
        if (e) return authErrorMessage(e, "signin");
        done();
        return null;
      }
      if (mode === "signup") {
        const problem = passwordProblem(password, confirmation);
        if (problem) return problem;
        const { data, error: e } = await auth.signUp({ email: address, password, options: { emailRedirectTo: callbackUrl() } });
        if (e) return authErrorMessage(e, "signup");
        if (data.session) {
          done();
          return null;
        }
        // Adresse déjà inscrite : Supabase ne le dit pas (pour ne pas révéler les comptes), il renvoie un compte sans identité.
        if (data.user && data.user.identities?.length === 0) return authErrorMessage({ code: "user_already_exists" }, "signup");
        setScreen({
          kind: "info",
          title: "Confirmez votre adresse",
          text: `Nous avons envoyé un e-mail à ${address}. Cliquez sur le lien qu'il contient pour activer votre compte, puis connectez-vous avec votre mot de passe. Pensez à regarder dans les indésirables.`,
        });
        return null;
      }
      if (mode === "forgot") {
        const { error: e } = await auth.resetPasswordForEmail(address, { redirectTo: callbackUrl("/compte/nouveau-mot-de-passe") });
        if (e) return authErrorMessage(e, "reset");
        setScreen({
          kind: "info",
          title: "Vérifiez votre boîte mail",
          text: `Si un compte existe pour ${address}, vous allez recevoir un lien pour choisir un nouveau mot de passe. Ouvrez-le dans ce navigateur. Pensez à regarder dans les indésirables.`,
        });
        return null;
      }
      const { error: e } = await auth.signInWithOtp({ email: address, options: { emailRedirectTo: callbackUrl(), shouldCreateUser: !signInOnly } });
      if (e) return authErrorMessage(e, "reset");
      setScreen({ kind: "code-sent" });
      return null;
    });
  };

  const verifyCode = (event: FormEvent) => {
    event.preventDefault();
    const token = normalizeOtpCode(code);
    if (!isValidOtpCode(token)) {
      setError("Le code contient 6 chiffres.");
      return;
    }
    void run(async () => {
      const { error: e } = await createClient().auth.verifyOtp({ email: email.trim(), token, type: "email" });
      if (e) return "Code incorrect ou expiré. Vérifiez-le, ou demandez un nouvel e-mail.";
      done();
      return null;
    });
  };

  const signInWithGoogle = () =>
    void run(async () => {
      const { error: e } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl() } });
      return e ? "La connexion avec Google n'a pas abouti. Réessayez ou utilisez votre e-mail." : null;
    });

  const back = () => {
    setScreen({ kind: "form" });
    setCode("");
    setError("");
  };

  if (screen.kind === "info") {
    return (
      <Card>
        <h2 className="text-base font-semibold text-slate-900">{screen.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{screen.text}</p>
        <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => { back(); switchMode("signin"); }}>
          Retour à la connexion
        </Button>
      </Card>
    );
  }

  if (screen.kind === "code-sent") {
    return (
      <Card>
        <h2 className="text-base font-semibold text-slate-900">Vérifiez votre boîte mail</h2>
        <p className="mt-2 text-sm text-slate-600">
          Nous avons envoyé un e-mail à <strong>{email.trim()}</strong>. Cliquez sur le lien qu&apos;il contient,
          ou saisissez ici le code à 6 chiffres s&apos;il en contient un. Pensez à regarder dans les indésirables.
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
            <Button type="submit" disabled={busy}>
              <KeyRound className="size-4" aria-hidden />
              {busy ? "Vérification…" : "Se connecter"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={back}>
              Changer d&apos;adresse
            </Button>
          </div>
          {error && <ErrorText>{error}</ErrorText>}
        </form>
      </Card>
    );
  }

  const heading =
    mode === "signup" ? "Créer un compte" : mode === "forgot" ? "Mot de passe oublié" : mode === "code" ? "Recevoir un code par e-mail" : (title ?? "Se connecter");
  const submitLabel = {
    signin: busy ? "Connexion…" : "Se connecter",
    signup: busy ? "Création…" : "Créer mon compte",
    forgot: busy ? "Envoi…" : "Recevoir le lien",
    code: busy ? "Envoi…" : "Recevoir le code",
  }[mode];
  const SubmitIcon = mode === "signup" ? UserPlus : mode === "signin" ? LogIn : Mail;

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900">{heading}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {mode === "signin" &&
          (intro ??
            "Le compte est optionnel : il sauvegarde votre projet (profil, candidatures, lettres, budget) et vous le retrouvez sur tous vos appareils.")}
        {mode === "signup" && `Choisissez un mot de passe d'au moins ${PASSWORD_MIN_LENGTH} caractères, avec au moins une lettre et un chiffre.`}
        {mode === "forgot" && "Saisissez votre adresse : vous recevrez un lien pour choisir un nouveau mot de passe."}
        {mode === "code" && "Sans mot de passe : vous recevez un e-mail avec un lien de connexion."}
      </p>

      {googleEnabled && !presetEmail && (mode === "signin" || mode === "signup") && (
        <div className="mt-4 space-y-3">
          <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={busy} onClick={signInWithGoogle}>
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

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <Label htmlFor="login-email">Adresse e-mail</Label>
          <Input
            id="login-email"
            type="email"
            required
            autoComplete={mode === "signup" ? "email" : "username"}
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={Boolean(presetEmail)}
          />
        </div>
        {(mode === "signin" || mode === "signup") && (
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="login-password">Mot de passe</Label>
              {mode === "signin" && (
                <button type="button" className="text-xs font-semibold text-blue-700 hover:underline" onClick={() => switchMode("forgot")}>
                  Mot de passe oublié ?
                </button>
              )}
            </div>
            <PasswordInput
              id="login-password"
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}
        {mode === "signup" && (
          <div>
            <Label htmlFor="login-confirmation">Confirmez le mot de passe</Label>
            <PasswordInput id="login-confirmation" required autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          </div>
        )}

        <Button type="submit" disabled={busy} className="w-full sm:w-auto">
          <SubmitIcon className="size-4" aria-hidden />
          {submitLabel}
        </Button>
        {error && <ErrorText>{error}</ErrorText>}

        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-sm">
          {mode !== "signin" && <ModeLink onClick={() => switchMode("signin")}>J&apos;ai déjà un mot de passe</ModeLink>}
          {mode === "signin" && !signInOnly && <ModeLink onClick={() => switchMode("signup")}>Créer un compte</ModeLink>}
          {mode !== "code" && <ModeLink onClick={() => switchMode("code")}>Recevoir plutôt un code par e-mail</ModeLink>}
        </div>

        {mode === "signup" && (
          <p className="text-xs leading-relaxed text-slate-600">
            En créant un compte, vous acceptez les{" "}
            <Link href="/conditions" className="underline underline-offset-2 hover:text-slate-800">
              conditions d&apos;utilisation
            </Link>
            . Votre e-mail sert uniquement à vous connecter ;{" "}
            <Link href="/confidentialite" className="underline underline-offset-2 hover:text-slate-800">
              confidentialité
            </Link>
            .
          </p>
        )}
      </form>
    </Card>
  );
}

function ModeLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="font-semibold text-blue-700 hover:underline">
      {children}
    </button>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm font-medium text-red-700">
      {children}
    </p>
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
