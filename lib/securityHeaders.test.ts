import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders, supabaseOrigin } from "./securityHeaders";

const SUPABASE = "https://abcd.supabase.co";

describe("supabaseOrigin", () => {
  it("garde seulement l'origine, même si un chemin a été collé", () => {
    expect(supabaseOrigin(`${SUPABASE}/rest/v1/`)).toBe(SUPABASE);
  });

  it("ignore une valeur absente ou invalide", () => {
    expect(supabaseOrigin(undefined)).toBeNull();
    expect(supabaseOrigin("pas une url")).toBeNull();
  });
});

describe("contentSecurityPolicy", () => {
  it("en production : Supabase autorisé, pas d'eval, HTTPS forcé", () => {
    const csp = contentSecurityPolicy({ isDev: false, supabaseUrl: SUPABASE });
    expect(csp).toContain(`connect-src 'self' ${SUPABASE}`);
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("ws:");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("en dev : eval et WebSocket autorisés, pas d'upgrade HTTPS sur localhost", () => {
    const csp = contentSecurityPolicy({ isDev: true, supabaseUrl: SUPABASE });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws:");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("sans Supabase configuré : connect-src limité à notre origine", () => {
    const csp = contentSecurityPolicy({ isDev: false });
    expect(csp).toContain("connect-src 'self';");
  });
});

describe("securityHeaders", () => {
  it("pose chaque en-tête une seule fois", () => {
    const keys = securityHeaders({ isDev: false }).map((header) => header.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "X-Frame-Options",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
      ]),
    );
  });
});
