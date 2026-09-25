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

Options de sécurité à la création :
- **Enable Data API** : ✅ coché (le client `supabase-js` en a besoin).
- **Automatically expose new tables** : ❌ décoché (recommandation
  Supabase) — les migrations accordent elles-mêmes les droits nécessaires
  (`grant ... to authenticated`), table par table.
- **Enable automatic RLS** : ✅ coché — filet de sécurité pour toute table
  future ; nos migrations activent déjà RLS explicitement.

## 2. Exécuter la migration SQL

Dans le tableau de bord Supabase → SQL Editor, coller et exécuter le
contenu de `supabase/migrations/0001_profiles.sql` (une seule table
`profiles`, avec Row Level Security déjà configurée dans le fichier).

## 3. Modèle d'e-mail "Magic Link" — rien à faire pour l'instant

Le modèle par défaut de Supabase fonctionne tel quel : `/auth/confirm`
accepte le `?code=` qu'il renvoie (flux PKCE). Limite : le lien doit être
ouvert **dans le même navigateur** que celui où la connexion a été
demandée.

Plus tard (avant l'ouverture à de vrais utilisateurs) : brancher un SMTP
personnalisé (ex: Resend) — obligatoire de toute façon, le SMTP intégré de
Supabase n'envoie que quelques e-mails par heure — puis, dans
Authentication → Email Templates → Magic Link, remplacer
`{{ .ConfirmationURL }}` par :

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/compte
```

pour que le lien fonctionne aussi d'un appareil à l'autre.

## 4. Renseigner l'URL du site

Supabase → Authentication → URL Configuration → **Site URL** : l'URL de
production (ex: `https://acadmatch.vercel.app` ou le domaine final), et
ajouter dans **Redirect URLs** : `https://<url-de-production>/**` et
`http://localhost:3000/**` (le `/**` est indispensable : sans lui, Supabase
refuse de rediriger vers `/auth/confirm` et renvoie sur la page d'accueil,
où la connexion échoue).

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
