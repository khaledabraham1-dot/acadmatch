import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LOCAL_STORAGE_ITEMS, SUBPROCESSORS } from "@/data/legal";

const ROOT = path.resolve(__dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [full] : [];
  });
}

/** Clés `acadmatch:…` réellement utilisées par le code applicatif. */
function storageKeysInCode(): Set<string> {
  const keys = new Set<string>();
  for (const dir of ["app", "components", "lib"]) {
    for (const file of sourceFiles(path.join(ROOT, dir))) {
      for (const match of readFileSync(file, "utf8").matchAll(/["'`](acadmatch:[A-Za-z-]+)["'`]/g)) {
        keys.add(match[1]);
      }
    }
  }
  return keys;
}

describe("politique de confidentialité", () => {
  it("décrit exactement les données gardées dans le navigateur", () => {
    const declared = new Set(LOCAL_STORAGE_ITEMS.map((item) => item.key));
    expect([...storageKeysInCode()].sort()).toEqual([...declared].sort());
  });

  it("nomme chaque sous-traitant avec un lien vers sa politique", () => {
    for (const processor of SUBPROCESSORS) {
      expect(processor.privacyUrl).toMatch(/^https:\/\//);
    }
  });
});
