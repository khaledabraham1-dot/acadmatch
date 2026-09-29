import { OG_SIZE, ogCard } from "@/components/og/ogCard";
import { FORMATIONS } from "@/data/formations";
import { publicFormations } from "@/lib/site";

export const alt = "Formation — prérequis et compatibilité sur AcadMatch";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return publicFormations(FORMATIONS).map((formation) => ({ id: formation.id }));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formation = publicFormations(FORMATIONS).find((candidate) => candidate.id === id);
  if (!formation) return ogCard({ eyebrow: "Formation", title: "AcadMatch", subtitle: "" });
  return ogCard({
    eyebrow: `${formation.goal} · ${formation.field}`,
    title: formation.name,
    subtitle: `${formation.institution.name} — ${formation.institution.city}, ${formation.institution.country}`,
  });
}
