# Fondations IA transverses (Phase 6)

Cette phase ne livre **aucune fonctionnalité visible** — c'est de la
plomberie commune, à réutiliser telle quelle par chaque future feature IA
de la roadmap (import multi-documents, lettre de motivation, préparation
aux entretiens, assistant). Objectif : ne pas re-découvrir les mêmes
questions (clé serveur, quotas, échecs) à chaque nouvelle feature.

## Ce qui existe

- `lib/ai/config.ts` — `isAiConfigured()`, le modèle utilisé (`AI_MODEL`),
  le quota journalier (`MAX_AI_REQUESTS_PER_DAY`).
- `lib/ai/client.ts` — client Anthropic serveur (`server-only`, clé jamais
  exposée au navigateur — même principe que `lib/supabase/admin.ts`).
- `lib/ai/rateLimit.ts` — quota journalier par utilisateur, basé sur la
  table `ai_usage` (Supabase, RLS scopée à `auth.uid()`).
- `lib/ai/callAi.ts` — point d'entrée unique : `callAi({ userId, feature,
  system, messages })`, renvoie `{ ok: true, text }` ou `{ ok: false,
  reason }` (`"not_configured" | "quota_exceeded" | "error"`) — jamais une
  exception à gérer au cas par cas dans chaque feature.

## Décisions et pourquoi

**Modèle : Claude Haiku 4.5**, pas le plus capable disponible. Les usages
prévus (extraction de documents, génération de texte assisté) ne demandent
pas un raisonnement de pointe, et le roadmap est explicite sur le contrôle
des coûts pour toute feature IA. Point d'ajustement unique
(`lib/ai/config.ts`) si une feature future a réellement besoin de plus.

**Exception : l'import du relevé de notes utilise Claude Opus 5**
(`AI_EXTRACTION_MODEL`, `callAiStructured` dans `lib/ai/callAi.ts`). Lire
une photo de téléphone ou un relevé étranger (abréviations, barèmes, autre
langue) demande une lecture fiable : une erreur fausse tout le matching de
l'étudiant, et l'appel est unique par étudiant (quelques centimes), pas
répété. Sortie JSON garantie par les sorties structurées, et repli
automatique côté serveur si le modèle décline (`fallbacks: "default"`).

**Les fonctionnalités IA nécessitent un compte** (Phase 5), contrairement
au reste d'AcadMatch qui reste utilisable sans connexion. Impossible
d'appliquer un quota par utilisateur à un visiteur anonyme sans identifiant
stable — c'est une différence de comportement assumée : le cœur du produit
(matching, recherche, comparaison) reste gratuit et sans compte ; les
features IA, qui coûtent réellement de l'argent par appel, demandent une
connexion.

**Quota unique partagé (20 requêtes/jour/utilisateur)** entre toutes les
futures features IA, pas un quota par fonctionnalité. Simplification
volontaire tant qu'aucune feature réelle n'existe pour mesurer son coût
réel par appel — à affiner une fois la première feature livrée.

**Aucun cache de prompt actif pour l'instant** (`cacheSystemPrompt` existe
dans `callAi` mais rien ne l'active) : le cache prompt Anthropic n'apporte
rien sur un prompt court ou qui change à chaque appel — seulement sur un
prompt long et stable réutilisé identique par de nombreux appels. Aucune
feature actuelle n'a ce profil ; à activer quand une aura un vrai system
prompt volumineux et fixe (ex: contexte complet du profil + catalogue pour
un futur assistant).

## Comment une future feature doit l'utiliser

Toujours depuis une route serveur (Route Handler ou Server Action) —
jamais depuis un composant client, la clé API ne doit jamais atteindre le
navigateur :

```ts
import { callAi } from "@/lib/ai/callAi";

const result = await callAi({
  userId: user.id, // depuis la session Supabase authentifiée
  feature: "lettre-motivation",
  system: "...",
  messages: [{ role: "user", content: "..." }],
});

if (!result.ok) {
  // gérer explicitement "not_configured" / "quota_exceeded" / "error" —
  // jamais laisser un échec IA bloquer silencieusement l'utilisateur.
}
```

## Configuration requise

Une seule variable, `ANTHROPIC_API_KEY` (voir `.env.example`). Sans elle,
`isAiConfigured()` renvoie `false` et toute feature IA future doit s'en
servir pour se dégrader proprement (même discipline que
`docs/accounts-setup.md` pour Supabase) — pas encore fait ici puisqu'aucune
UI IA n'existe encore.

## Migration à exécuter

`supabase/migrations/0002_ai_usage.sql` (table `ai_usage`, journal
d'appels avec RLS) — à exécuter dans le même SQL Editor Supabase que
`0001_profiles.sql` (voir `docs/accounts-setup.md`).

## Fonctionnalités qui l'utilisent

| Fonctionnalité | Route | `feature` (ai_usage) |
|---|---|---|
| Lettre de motivation (Phase 17) | `app/api/lettre-motivation/route.ts` | `lettre-motivation` |
| Préparation aux entretiens (Phase 18) | `app/api/entretien/route.ts` | `entretien-questions`, `entretien-feedback` |
| Import du relevé de notes | `app/api/releve/route.ts` | `releve-notes` |
| Import du programme de formation | `app/api/programme/route.ts` | `programme-formation` |

Toutes partagent `lib/ai/routeAuth.ts` (compte requis, dégradation 503/401,
traduction des échecs typés), `lib/ai/promptContext.ts` (mise en forme du
profil et de la formation + validation du profil reçu, jamais digne de
confiance puisqu'il vient de localStorage) et, côté client,
`components/ai/AiFeature.tsx`. Chaque appel (une génération de questions,
un retour sur une réponse) compte pour une unité du quota journalier
partagé — y compris un appel dont la réponse s'avère inexploitable.

Seule source d'expériences autorisée pour l'IA : le champ optionnel
`StudentProfile.experiences` (formulaire de profil). Aucune fonctionnalité
n'invente d'expérience, et la préparation aux entretiens ne rédige jamais
la réponse à la place de l'étudiant — elle la commente.

### Import du relevé de notes — règles

- **L'étudiant valide tout** : l'extraction n'est qu'une proposition, revue
  matière par matière (`components/profile/TranscriptImport.tsx`) ; le
  niveau et l'auto-évaluation déduits de la moyenne ne sont que des
  suggestions à accepter d'un clic.
- **Données personnelles** : consentement explicite avant l'envoi ; le
  fichier est lu en mémoire puis oublié (jamais stocké ni journalisé) ; le
  prompt interdit d'extraire nom, numéro étudiant, date de naissance ou
  adresse (vérifié sur un relevé fictif qui en contenait).
- **Formats** : PDF, JPEG, PNG, WebP, 4 Mo maximum (limite de corps de
  requête de Vercel : 4,5 Mo) ; les photos sont réduites dans le navigateur
  avant l'envoi.
- **Vocabulaire** : le prompt fournit les intitulés du catalogue pour que
  les matières lues soient comparables par le moteur, sans jamais
  rapprocher deux sujets différents ni remplacer un sujet par un format de
  cours (TP, projet, stage) — règle ajustée après deux essais réels.

### Import du programme de formation — règles

Complément du relevé (`lib/ai/syllabusPrompt.ts`,
`components/profile/SyllabusImport.tsx`) : le relevé dit quels cours ont été
**suivis**, le programme (descriptif des enseignements, syllabus, supplément
au diplôme) dit ce qu'ils **contenaient**.

- **Seuls les cours suivis comptent** : chaque module est rapproché des
  matières déjà dans le profil ; le serveur n'accepte qu'un rapprochement
  vers une matière réellement envoyée. Les modules non reconnus (souvent
  des options non choisies) sont proposés décochés.
- **Compétence = descriptif** : jamais déduite du seul intitulé ; un
  module sans descriptif ne donne aucune compétence. Libellés au niveau
  d'un thème, d'un outil ou d'un langage, dans le vocabulaire du catalogue
  quand c'est le même sujet.
- **PDF, photo ou texte collé** (40 000 caractères au plus), même modèle,
  même quota et mêmes garanties de confidentialité que le relevé.
- Vérifié le 2026-09-28 par un vrai appel (programme SMI, Kénitra) :
  POO reconnue comme « Programmation orientée objet », option non suivie
  laissée décochée, aucune donnée personnelle renvoyée (nom, CNE,
  enseignant).
