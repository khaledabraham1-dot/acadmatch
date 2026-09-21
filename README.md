# AcadMatch

Prototype (MVP) qui aide les étudiants à déterminer quelles formations françaises
correspondent à leur parcours académique — sans création de compte obligatoire.

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
  Data Science / IA / Informatique) et référentiels de matières/compétences. Processus
  d'ajout/vérification d'une formation : voir [`docs/data-sourcing.md`](docs/data-sourcing.md).
- `types/` — types TypeScript partagés (`StudentProfile`, `StudyProgram`, `Institution`, `CompatibilityResult`, ...).
  `StudyProgram` (anciennement `Formation`) est générique : `institution.country` porte le pays, préparant
  l'ajout de futurs pays sans toucher au moteur de matching (voir roadmap — architecture internationale).
- `app/compte/`, `lib/supabase/` — comptes utilisateurs **optionnels** (sauvegarder son profil pour le
  retrouver sur un autre appareil) : voir [`docs/accounts-setup.md`](docs/accounts-setup.md) pour la
  configuration. Sans elle, `/compte` affiche "bientôt disponible" et le reste de l'app est inchangé.
- `lib/ai/` — fondations IA transverses (client Claude serveur, quotas, appel générique), pas encore
  utilisées par une fonctionnalité visible : voir [`docs/ai-integration.md`](docs/ai-integration.md).

⚠️ Le catalogue est volontairement limité. Toute fiche `demo: true` doit rester clairement
marquée comme démonstration — jamais présentée comme officielle.

## Développement

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

```bash
npm run lint             # ESLint
npm run test             # Vitest
npm run build            # build de production
npm run audit:catalogue  # intégrité des données du catalogue (voir docs/data-sourcing.md)
```

## Feedback MVP

Sur la page résultat, les utilisateurs peuvent indiquer si l'analyse les a aidés.
Par défaut l'avis reste en `localStorage`. Pour recevoir les avis par e-mail :

```bash
cp .env.example .env.local
# renseigner NEXT_PUBLIC_FEEDBACK_EMAIL=vous@exemple.com
```

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · persistance locale via `localStorage`
par défaut ; Supabase (Postgres + Auth) en option pour les comptes utilisateurs, voir
[`docs/accounts-setup.md`](docs/accounts-setup.md).

## Hors périmètre du MVP actuel

Volontairement non traité pour l'instant (voir `AcadMatch_Roadmap_MVP_v1.docx`) : candidature
automatisée ou remplissage Campus France, prédiction d'admission, chatbot généraliste,
marketplace de consultants, extension immédiate à tous les pays, monétisation, IA générative
par défaut dans le moteur. `StudyGoal` propose "Doctorat" en anticipation d'un futur
élargissement du catalogue, mais aucune formation de ce type n'y figure encore — l'app le
signale explicitement à l'utilisateur plutôt que de le masquer (voir `CatalogueScopeNotice`).

Pistes V2+ : import/compréhension de syllabus PDF, équivalences sémantiques par IA, analyse de
CV/projets, recommandations personnalisées, extension à d'autres pays, offre B2B écoles.
