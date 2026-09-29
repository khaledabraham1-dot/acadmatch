import type { Metadata } from "next";

// La page est un composant client (filtres interactifs) : ses métadonnées vivent ici.
export const metadata: Metadata = {
  title: "Formations en France et en Belgique : licences, masters, écoles",
  description:
    "Parcourez des licences, masters et écoles d'ingénieurs vérifiés sur leurs pages officielles, et voyez lesquels correspondent à votre parcours.",
  alternates: { canonical: "/recherche" },
};

export default function RechercheLayout({ children }: LayoutProps<"/recherche">) {
  return children;
}
