import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { JOURNEY_STEPS, journeyRow } from "@/lib/journey";

describe("mesure anonyme du parcours", () => {
  it("n'envoie que l'étape, un détail court et le type d'appareil", () => {
    const row = journeyRow("partage", "x".repeat(100), true);
    expect(Object.keys(row).sort()).toEqual(["detail", "device", "step"]);
    expect(row.detail).toHaveLength(40);
    expect(row.device).toBe("mobile");
  });

  it("déclare dans la migration exactement les étapes du code", () => {
    const sql = readFileSync("supabase/migrations/0007_journey_events.sql", "utf8");
    const declared = [...sql.slice(sql.indexOf("step in ("), sql.indexOf("))")).matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
    expect(declared).toEqual([...JOURNEY_STEPS]);
  });
});
