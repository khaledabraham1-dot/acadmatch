import { Home, Search, User, BarChart3, FolderKanban, ClipboardList, CalendarDays, PenLine, UserCircle } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/profil", label: "Mon profil académique", icon: User },
  { href: "/recherche", label: "Rechercher une formation", icon: Search },
  { href: "/resultat", label: "Résultats", icon: BarChart3 },
  { href: "/espace", label: "Mon espace", icon: FolderKanban },
  { href: "/candidatures", label: "Suivi des candidatures", icon: ClipboardList },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/lettre-motivation", label: "Lettre de motivation", icon: PenLine },
  { href: "/compte", label: "Mon compte", icon: UserCircle },
] as const;
