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
