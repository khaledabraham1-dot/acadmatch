"use client";

import { useEffect, useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { buildShareUrl, whatsappShareHref } from "@/lib/share";
import { cn } from "@/lib/utils";

interface ShareButtonsProps {
  /** Chemin public partagé (ex. /formations/f-…), jamais une page personnelle. */
  path: string;
  /** Message d'accompagnement ; le lien est ajouté à la fin. */
  text: string;
  className?: string;
}

// cn() ne fusionne pas les classes Tailwind en conflit : chaque bouton a sa palette complète.
const BUTTON_BASE = "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold";
const buttonClass = `${BUTTON_BASE} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
const whatsappClass = `${BUTTON_BASE} border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100`;

/**
 * Partage en un geste : WhatsApp d'abord (le canal des étudiants visés, et
 * des familles qui financent souvent les études), puis le partage natif du
 * téléphone et la copie du lien. Rien n'est envoyé tant que l'étudiant ne
 * clique pas : le lien wa.me ne fait qu'ouvrir WhatsApp avec le message.
 */
export function ShareButtons({ path, text, className }: ShareButtonsProps) {
  const [origin, setOrigin] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // window n'existe pas côté serveur : l'origine et le partage natif se lisent après le montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    setCanShare(typeof navigator.share === "function");
  }, []);

  const url = (channel: string) => buildShareUrl(origin, path, channel);

  async function handleNativeShare() {
    try {
      await navigator.share({ text, url: url("partage-natif") });
    } catch {
      // Partage annulé par l'étudiant : rien à faire.
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url("lien"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Presse-papiers refusé (navigateur ancien) : le bouton reste sans effet.
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <a
        href={whatsappShareHref(text, url("whatsapp"))}
        target="_blank"
        rel="noopener noreferrer"
        className={whatsappClass}
      >
        <MessageCircle className="size-4" aria-hidden />
        Partager sur WhatsApp
      </a>
      {canShare && (
        <button type="button" onClick={handleNativeShare} className={buttonClass}>
          <Share2 className="size-4" aria-hidden />
          Autres applis
        </button>
      )}
      <button type="button" onClick={handleCopy} className={buttonClass} aria-live="polite">
        {copied ? <Check className="size-4 text-emerald-700" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
        {copied ? "Lien copié" : "Copier le lien"}
      </button>
    </div>
  );
}
