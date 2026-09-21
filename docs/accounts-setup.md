# Configuration des comptes utilisateurs (Phase 5)

Le code est prêt et déployé, mais **5 étapes manuelles côté Supabase** sont
nécessaires — je ne peux pas les faire à votre place (création de compte,
tableau de bord web). Tant qu'elles ne sont pas faites, `/compte` affiche
simplement "bientôt disponible" et le reste d'AcadMatch fonctionne
normalement (aucune régression).

## 1. Créer le projet Supabase

Sur [supabase.com](https://supabase.com), créer un nouveau projet.
**Choisir une région européenne** (ex: Frankfurt/EU Central) — le public
d'AcadMatch est en France/UE, et ça simplifie toute question de conformité
RGPD plus tard.

## 2. Exécuter la migration SQL

Dans le tableau de bord Supabase → SQL Editor, coller et exécuter le
contenu de `supabase/migrations/0001_profiles.sql` (une seule table
`profiles`, avec Row Level Security déjà configurée dans le fichier).

## 3. Personnaliser le modèle d'e-mail "Magic Link"

Supabase → Authentication → Email Templates → **Magic Link**. Remplacer le
lien par défaut pour qu'il pointe vers notre route de confirmation :

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/compte
```

Sans cette étape, le lien reçu par e-mail pointe vers une page Supabase
générique au lieu de connecter l'utilisateur sur AcadMatch.

## 4. Renseigner l'URL du site

Supabase → Authentication → URL Configuration → **Site URL** : l'URL de
production (ex: `https://acadmatch.vercel.app` ou le domaine final), et
ajouter la même URL + `http://localhost:3000` dans **Redirect URLs** (pour
pouvoir tester en local).

## 5. Récupérer les clés et les renseigner

Supabase → Project Settings → API Keys. Copier :
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **Publishable key** (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Secret key** (`sb_secret_...`) → `SUPABASE_SECRET_KEY` — **jamais** avec
  le préfixe `NEXT_PUBLIC_`, ne doit jamais atteindre le navigateur (utilisée
  uniquement par `app/api/account/delete/route.ts` pour supprimer un
  compte).

À renseigner dans `.env.local` (copier `.env.example`) pour le développement
local, **et** dans Vercel → Project Settings → Environment Variables pour la
production.

## Après configuration

Une fois les 5 étapes faites, `/compte` propose : connexion par lien
magique (pas de mot de passe à gérer), sauvegarde/chargement du profil,
export JSON des données et suppression de compte. Donnez-moi l'URL et les
clés une fois créées si vous voulez que je vérifie le flux de bout en bout
avec vous.

## Ce que cette phase ne fait PAS (volontairement)

Seul `StudentProfile` est synchronisable pour l'instant — pas encore les
candidatures, documents ou CV des phases suivantes de la roadmap, qui
s'appuieront sur cette fondation (auth + isolation des données) une fois
en place. Le compte reste entièrement optionnel : `localStorage` continue
de fonctionner sans connexion, comme depuis le début.
