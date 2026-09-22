import { AppShell } from "@/components/shell/AppShell";
import { CalendarView } from "@/components/calendar/CalendarView";

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
