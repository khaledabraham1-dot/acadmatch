import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCalendarEntries,
  formatCalendarDate,
  groupEntriesByDate,
  isOverdue,
  sortCalendarEntries,
  todayIso,
} from "@/lib/calendar";
import { createApplication } from "@/lib/applications";
import type { Application, StudyProgram } from "@/types";

function formation(overrides: Partial<StudyProgram> = {}): StudyProgram {
  return {
    id: "f-a",
    name: "Master Test",
    institution: { name: "Université Test", city: "Paris", country: "France" },
    level: "Master 1",
    goal: "Master",
    field: "Informatique",
    description: "",
    prerequisites: [],
    coreCourses: [],
    skills: [],
    requiredLevel: "Licence 3",
    language: "Français",
    applicationProcedure: "Test",
    source: "https://example.fr",
    verifiedAt: "2026-01-01",
    verificationStatus: "vérifiée",
    demo: false,
    ...overrides,
  } as StudyProgram;
}

describe("buildCalendarEntries", () => {
  it("crée une entrée 'deadline' pour une échéance personnelle renseignée", () => {
    const app: Application = { ...createApplication("f-a"), deadline: "2026-02-01" };
    const entries = buildCalendarEntries([app], [formation()]);
    expect(entries).toEqual([
      {
        formationId: "f-a",
        formationName: "Master Test",
        date: "2026-02-01",
        source: "deadline",
        label: "Échéance personnelle — Master Test",
        done: false,
      },
    ]);
  });

  it("ignore une candidature sans échéance et sans élément daté", () => {
    const app = createApplication("f-a");
    expect(buildCalendarEntries([app], [formation()])).toEqual([]);
  });

  it("crée une entrée par document/action ayant un dueDate, ignore les autres", () => {
    const app: Application = {
      ...createApplication("f-a"),
      documents: [
        { id: "d1", label: "Relevé de notes", done: false, dueDate: "2026-01-10" },
        { id: "d2", label: "CV", done: true },
      ],
      nextActions: [{ id: "a1", label: "Demander une lettre", done: false, dueDate: "2026-01-05" }],
    };
    const entries = buildCalendarEntries([app], [formation()]);
    expect(entries).toHaveLength(2);
    expect(entries.find((e) => e.itemId === "d1")).toMatchObject({ source: "document", date: "2026-01-10" });
    expect(entries.find((e) => e.itemId === "a1")).toMatchObject({ source: "nextAction", date: "2026-01-05" });
    expect(entries.some((e) => e.itemId === "d2")).toBe(false);
  });

  it("ignore une candidature dont la formation n'existe plus au catalogue", () => {
    const app: Application = { ...createApplication("f-gone"), deadline: "2026-02-01" };
    expect(buildCalendarEntries([app], [formation({ id: "f-a" })])).toEqual([]);
  });
});

describe("sortCalendarEntries / groupEntriesByDate", () => {
  const entries = [
    { formationId: "f-a", formationName: "A", date: "2026-03-01", source: "deadline" as const, label: "L", done: false },
    { formationId: "f-b", formationName: "B", date: "2026-01-01", source: "deadline" as const, label: "L", done: false },
    { formationId: "f-c", formationName: "C", date: "2026-01-01", source: "deadline" as const, label: "L2", done: false },
  ];

  it("trie par date croissante", () => {
    expect(sortCalendarEntries(entries).map((e) => e.formationId)).toEqual(["f-b", "f-c", "f-a"]);
  });

  it("regroupe par date, groupes eux-mêmes en ordre chronologique", () => {
    const grouped = groupEntriesByDate(entries);
    expect([...grouped.keys()]).toEqual(["2026-01-01", "2026-03-01"]);
    expect(grouped.get("2026-01-01")).toHaveLength(2);
  });
});

describe("dates et fuseaux horaires (consigne explicite de la phase)", () => {
  const realTimezone = process.env.TZ;

  afterEach(() => {
    process.env.TZ = realTimezone;
    vi.useRealTimers();
  });

  it("formatCalendarDate affiche le même jour quel que soit le fuseau du visiteur", () => {
    // UTC-11 (Samoa) et UTC+14 (Kiribati) : les deux fuseaux les plus extrêmes.
    for (const tz of ["Pacific/Pago_Pago", "Pacific/Kiritimati", "UTC"]) {
      process.env.TZ = tz;
      expect(formatCalendarDate("2026-01-15")).toContain("15 janvier 2026");
    }
  });

  it("todayIso reste stable quel que soit le fuseau (ancré en UTC)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
    for (const tz of ["Pacific/Pago_Pago", "Pacific/Kiritimati", "UTC"]) {
      process.env.TZ = tz;
      expect(todayIso()).toBe("2026-06-15");
    }
  });

  it("isOverdue compare des chaînes ISO, jamais des Date locales", () => {
    expect(isOverdue({ date: "2026-01-01", done: false }, new Date("2026-06-15T12:00:00.000Z"))).toBe(true);
    expect(isOverdue({ date: "2026-12-01", done: false }, new Date("2026-06-15T12:00:00.000Z"))).toBe(false);
    expect(isOverdue({ date: "2026-01-01", done: true }, new Date("2026-06-15T12:00:00.000Z"))).toBe(false);
  });
});
