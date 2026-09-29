import { afterEach, describe, expect, it, vi } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { TUITION_FEES } from "@/data/budget";
import {
  formationDescription,
  formationTitle,
  MAX_TITLE_LENGTH,
  publicFormations,
  siteUrl,
  truncateForMeta,
} from "./site";
import { formationJsonLd, serializeJsonLd } from "./structuredData";

const formations = publicFormations(FORMATIONS);

describe("siteUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("préfère le domaine déclaré, sans slash final", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://acadmatch.org/");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "acadmatch-campus.vercel.app");
    expect(siteUrl()).toBe("https://acadmatch.org");
  });

  it("retombe sur le domaine de production Vercel", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "acadmatch-campus.vercel.app");
    expect(siteUrl()).toBe("https://acadmatch-campus.vercel.app");
  });
});

describe("pages formations", () => {
  it("n'exposent jamais une fiche de démonstration", () => {
    expect(formations.every((formation) => !formation.demo)).toBe(true);
  });

  it("ont un titre court quand c'est possible, et unique", () => {
    const titles = formations.map(formationTitle);
    for (const [index, title] of titles.entries()) {
      expect(title.length <= MAX_TITLE_LENGTH || title === formations[index].name).toBe(true);
    }
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("ont une meta description d'au plus 155 caractères", () => {
    for (const formation of formations) {
      expect(formationDescription(formation).length).toBeLessThanOrEqual(155);
    }
  });
});

describe("truncateForMeta", () => {
  it("coupe sur un mot entier et signale la coupure", () => {
    const result = truncateForMeta("un deux trois quatre cinq", 14);
    expect(result).toBe("un deux trois…");
  });

  it("laisse un texte court intact", () => {
    expect(truncateForMeta("  court  ")).toBe("court");
  });
});

describe("données structurées", () => {
  it("n'affichent un prix que s'il est officiel, jamais indicatif", () => {
    for (const formation of formations) {
      const fee = TUITION_FEES[formation.id];
      const data = formationJsonLd(formation, "https://example.org", fee);
      expect("offers" in data).toBe(Boolean(fee && !fee.eu.indicative));
    }
  });

  it("ne peuvent pas fermer la balise script", () => {
    expect(serializeJsonLd({ name: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});
