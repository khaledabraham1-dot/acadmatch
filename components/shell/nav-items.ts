import { Home, Search, User, BarChart3, UserCircle } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/profil", label: "Mon profil académique", icon: User },
  { href: "/recherche", label: "Rechercher une formation", icon: Search },
  { href: "/resultat", label: "Résultats", icon: BarChart3 },
  { href: "/compte", label: "Mon compte", icon: UserCircle },
] as const;
