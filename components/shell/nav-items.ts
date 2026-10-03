import { BookOpen, Home, Search, User, BarChart3, FolderKanban, ClipboardList, CalendarDays, PenLine, MessagesSquare, Wallet, Stamp, UserCircle } from "lucide-react";

/** Étapes du parcours, dans l'ordre : elles regroupent les tuiles du menu mobile. */
export const NAV_GROUPS = ["Choisir", "Candidater", "Partir", "Compte"] as const;

export const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: Home, group: "Compte" },
  { href: "/profil", label: "Mon profil académique", icon: User, group: "Choisir" },
  { href: "/recherche", label: "Rechercher une formation", icon: Search, group: "Choisir" },
  { href: "/resultat", label: "Résultats", icon: BarChart3, group: "Choisir" },
  { href: "/guides", label: "Guides", icon: BookOpen, group: "Choisir" },
  { href: "/espace", label: "Mon espace", icon: FolderKanban, group: "Candidater" },
  { href: "/candidatures", label: "Suivi des candidatures", icon: ClipboardList, group: "Candidater" },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays, group: "Candidater" },
  { href: "/lettre-motivation", label: "Lettre de motivation", icon: PenLine, group: "Candidater" },
  { href: "/entretiens", label: "Entretiens", icon: MessagesSquare, group: "Candidater" },
  { href: "/budget", label: "Budget", icon: Wallet, group: "Partir" },
  { href: "/visa", label: "Visa", icon: Stamp, group: "Partir" },
  { href: "/compte", label: "Mon compte", icon: UserCircle, group: "Compte" },
] as const;
