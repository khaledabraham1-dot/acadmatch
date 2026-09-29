import { OG_SIZE, ogCard } from "@/components/og/ogCard";

export const alt = "AcadMatch — votre parcours correspond-il aux formations en France et en Belgique ?";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Études en France et en Belgique",
    title: "Votre parcours correspond-il vraiment à la formation visée ?",
    subtitle: "Comparez votre relevé de notes aux prérequis d'entrée, comme un jury.",
  });
}
