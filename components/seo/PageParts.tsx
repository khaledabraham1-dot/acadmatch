import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { breadcrumbJsonLd, faqJsonLd, serializeJsonLd } from "@/lib/structuredData";
import { formatCalendarDate } from "@/lib/calendar";

/**
 * Briques des pages publiques éditoriales (domaines, guides) : fil d'Ariane
 * visible + balisé, FAQ visible + balisée, sources officielles datées. Le
 * balisage ne décrit jamais que ce qui est affiché sur la page.
 */

export interface Crumb {
  name: string;
  path: string;
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

export function Breadcrumbs({ items, baseUrl }: { items: Crumb[]; baseUrl: string }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items, baseUrl)} />
      <nav aria-label="Fil d'Ariane" className="-mt-4 mb-6 flex flex-wrap items-center gap-1 text-sm text-slate-500">
        {items.map((item, index) =>
          index === items.length - 1 ? (
            <span key={item.path} className="text-slate-700" aria-current="page">
              {item.name}
            </span>
          ) : (
            <span key={item.path} className="inline-flex items-center gap-1">
              <Link href={item.path} className="hover:text-slate-800">
                {item.name}
              </Link>
              <ChevronRight className="size-3.5" aria-hidden />
            </span>
          ),
        )}
      </nav>
    </>
  );
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function Faq({ items, title = "Questions fréquentes" }: { items: FaqItem[]; title?: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="faq-title" className="space-y-3">
      <JsonLd data={faqJsonLd(items)} />
      <h2 id="faq-title" className="text-lg font-bold text-slate-900">
        {title}
      </h2>
      <div className="divide-y divide-slate-200 rounded-[18px] border border-slate-200 bg-white">
        {items.map((item) => (
          <div key={item.question} className="px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-slate-900">{item.question}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export interface SourceLink {
  label: string;
  url: string;
}

/** Sources officielles et date de mise à jour : ce qui distingue un guide fiable d'un article d'orientation. */
export function Sources({ sources, updatedAt }: { sources: SourceLink[]; updatedAt: string }) {
  return (
    <section aria-labelledby="sources-title" className="rounded-[18px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
      <h2 id="sources-title" className="text-sm font-bold uppercase tracking-wide text-slate-600">
        Sources officielles
      </h2>
      <ul className="mt-3 space-y-1.5 text-sm">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800"
            >
              {source.label}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-600">
        Vérifié le {formatCalendarDate(updatedAt)}. AcadMatch est indépendant de Campus France et des établissements :
        la source officielle fait toujours foi.
      </p>
    </section>
  );
}

/** Bloc de texte d'un guide : titre de section + contenu. */
export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-lg font-bold text-slate-900">
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}
