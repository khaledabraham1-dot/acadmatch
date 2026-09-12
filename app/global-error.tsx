"use client";

/**
 * Dernier filet de sécurité : se déclenche uniquement si l'erreur vient du
 * root layout lui-même (donc avant que la mise en page normale ne soit
 * disponible). Volontairement minimal et sans dépendance au design system,
 * pour rester fiable même si le reste de l'app est dans un état anormal.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#0f172a",
          background: "#f8fafc",
        }}
      >
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>AcadMatch a rencontré une erreur</h1>
        <p style={{ color: "#64748b", maxWidth: "28rem" }}>
          Veuillez réessayer. Si le problème persiste, essayez de recharger la page depuis un
          autre navigateur.
        </p>
        <button
          onClick={reset}
          style={{
            height: "44px",
            padding: "0 20px",
            borderRadius: "12px",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
