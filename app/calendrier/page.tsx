import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/site";
import { AppShell } from "@/components/shell/AppShell";
import { CalendarView } from "@/components/calendar/CalendarView";

export const metadata: Metadata = {
  title: "Calendrier personnalisé",
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function CalendrierPage() {
  return (
    <AppShell
      title="Calendrier personnalisé"
      description="Vos rappels d'échéances, documents et actions — jamais une date officielle affirmée par AcadMatch."
    >
      <CalendarView />
    </AppShell>
  );
}
