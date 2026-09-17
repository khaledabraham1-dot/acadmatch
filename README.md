# AcadMatch

Prototype (MVP) qui aide les étudiants à déterminer quelles formations françaises
correspondent à leur parcours académique — sans création de compte.

AcadMatch n'est **pas** Campus France : c'est une aide à la décision (compatibilité,
forces, lacunes, sources officielles) avant de candidater.

## Parcours

Accueil → Analyser mon profil → Rechercher une formation → Résultat de compatibilité détaillé
(et comparaison de 2–3 formations).

## Ce que contient ce dépôt

- `app/` — pages Next.js (App Router) : accueil, profil, recherche, résultat.
- `components/` — composants UI, découpés par domaine (`landing`, `profile`, `search`, `result`, `shell`, `ui`).
- `lib/matching/engine.ts` — moteur de scoring **déterministe**, sans IA externe, séparé de l'UI et remplaçable.
- `data/` — catalogue de formations françaises **réelles et vérifiées** (périmètre actuel :
  Data Science / IA / Informatique) et référentiels de matières/compétences.
- `types/` — types TypeScript partagés (`StudentProfile`, `Formation`, `CompatibilityResult`, ...).

⚠️ Le catalogue est volontairement limité. Toute fiche `demo: true` doit rester clairement
marquée comme démonstration — jamais présentée comme officielle.

## Développement

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

```bash
npm run lint   # ESLint
npm run test   # Vitest
npm run build  # build de production
```

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · aucune base de données (persistance
locale via `localStorage` pour ce prototype).
