import { ImageResponse } from "next/og";

/** Format recommandé par Facebook, WhatsApp, LinkedIn et X. */
export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Image d'aperçu partagée (next/og) : lisible en petit dans une
 * conversation WhatsApp, donc peu de texte et très contrasté. Chaque div à
 * plusieurs enfants doit être en flex (contrainte du moteur de rendu).
 */
export function ogCard({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#0f172a",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#2563eb",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 34, fontWeight: 600 }}>AcadMatch</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 28, color: "#93c5fd" }}>{eyebrow}</div>
          <div style={{ fontSize: title.length > 60 ? 52 : 64, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 30, color: "#cbd5e1" }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#94a3b8" }}>
          Prérequis vérifiés sur les sources officielles · Gratuit
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
