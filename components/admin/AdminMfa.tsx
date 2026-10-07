"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ShieldCheck, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { isValidOtpCode, normalizeOtpCode } from "@/lib/auth/otp";

/**
 * Double vérification de l'espace admin (2026-10-07), avec une application
 * d'authentification (Google Authenticator, Microsoft Authenticator, 2FAS…) :
 * - « enroll » : première fois, on scanne le QR code puis on saisit un code ;
 * - « verify » : ensuite, à chaque connexion, on saisit le code du moment.
 * Le serveur (lib/admin/session.ts) n'ouvre l'admin qu'au niveau « aal2 ».
 */
export function AdminMfa({ mode }: { mode: "enroll" | "verify" }) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<{ svg: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    // Une seule inscription, même si React exécute l'effet deux fois en développement.
    if (started.current) return;
    started.current = true;
    const mfa = createClient().auth.mfa;
    void (async () => {
      const { data, error: listError } = await mfa.listFactors();
      if (listError) {
        setError("Lecture de la double vérification impossible. Rechargez la page.");
        return;
      }
      if (mode === "verify") {
        const factor = data.totp.find((f) => f.status === "verified");
        if (factor) setFactorId(factor.id);
        else setError("Aucune application d'authentification n'est enregistrée. Rechargez la page.");
        return;
      }
      // Une inscription commencée puis abandonnée bloquerait la nouvelle : on la retire d'abord.
      for (const stale of data.all.filter((f) => f.factor_type === "totp" && f.status !== "verified")) {
        await mfa.unenroll({ factorId: stale.id });
      }
      const { data: enrolled, error: enrollError } = await mfa.enroll({ factorType: "totp", friendlyName: "AcadMatch admin", issuer: "AcadMatch" });
      if (enrollError || !enrolled) {
        setError("Activation impossible pour le moment. Vérifiez que la double vérification (TOTP) est activée dans Supabase, puis rechargez.");
        return;
      }
      setFactorId(enrolled.id);
      setQr({ svg: enrolled.totp.qr_code, secret: enrolled.totp.secret });
    })();
  }, [mode]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const token = normalizeOtpCode(code);
    if (!factorId) return;
    if (!isValidOtpCode(token)) {
      setError("Le code contient 6 chiffres.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: verifyError } = await createClient().auth.mfa.challengeAndVerify({ factorId, code: token });
    if (verifyError) {
      setBusy(false);
      setCode("");
      setError("Code incorrect ou expiré. Saisissez le code affiché en ce moment dans l'application.");
      return;
    }
    window.location.reload();
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
          {mode === "enroll" ? <Smartphone className="size-5" aria-hidden /> : <ShieldCheck className="size-5" aria-hidden />}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">
            {mode === "enroll" ? "Activez la double vérification" : "Code de vérification"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {mode === "enroll"
              ? "Une seule fois : installez une application d'authentification sur votre téléphone (Google Authenticator, Microsoft Authenticator ou 2FAS), scannez ce QR code, puis saisissez le code à 6 chiffres qu'elle affiche. Ensuite, même avec votre mot de passe, personne ne pourra entrer sans votre téléphone."
              : "Ouvrez votre application d'authentification et saisissez le code à 6 chiffres affiché pour AcadMatch."}
          </p>
        </div>
      </div>

      {mode === "enroll" && qr && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR code SVG fourni par Supabase, jamais mis en cache */}
          <img src={`data:image/svg+xml;utf-8,${encodeURIComponent(qr.svg)}`} alt="QR code à scanner avec l'application d'authentification" className="size-44 rounded-xl border border-slate-200 bg-white p-2" />
          <div className="min-w-0 text-sm text-slate-600">
            <p>Impossible de scanner ? Saisissez cette clé dans l&apos;application :</p>
            <code className="mt-1 block break-all rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-900">{qr.secret}</code>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <Label htmlFor="mfa-code">Code à 6 chiffres</Label>
          <Input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={7}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="max-w-[12rem] text-lg tracking-[0.3em]"
            autoFocus
          />
        </div>
        <Button type="submit" disabled={busy || !factorId}>
          <ShieldCheck className="size-4" aria-hidden />
          {busy ? "Vérification…" : mode === "enroll" ? "Activer et entrer" : "Entrer"}
        </Button>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </form>
    </Card>
  );
}
