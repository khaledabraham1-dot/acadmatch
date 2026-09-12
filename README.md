# AcadMatch

Prototype (MVP) qui aide les étudiants à déterminer quelles formations françaises
correspondent à leur parcours académique — sans création de compte.

## Parcours

Accueil → Analyser mon profil → Rechercher une formation → Résultat de compatibilité détaillé.

## Ce que contient ce dépôt

- `app/` — pages Next.js (App Router) : accueil, profil, recherche, résultat.
- `components/` — composants UI, découpés par domaine (`landing`, `profile`, `search`, `result`, `shell`, `ui`).
- `lib/matching/engine.ts` — moteur de scoring **déterministe**, sans IA externe, séparé de l'UI et remplaçable.
- `data/` — formations françaises **fictives** (données de démonstration) et référentiels de matières/compétences.
- `types/` — types TypeScript partagés (`StudentProfile`, `Formation`, `CompatibilityResult`, ...).

⚠️ Les formations affichées sont des données de démonstration inventées pour le
prototype — à remplacer par des données officielles avant toute mise en production.

## Développement

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

```bash
npm run lint   # ESLint
npm run build  # build de production
```

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · aucune base de données (persistance
locale via `localStorage` pour ce prototype).
