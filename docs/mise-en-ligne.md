# Mise en ligne d'AcadMatch — checklist complète

À suivre dans l'ordre, le jour où tu lances. Compte **2 à 3 heures** (dont
de l'attente pendant que les enregistrements DNS se propagent). Coche chaque
case au fur et à mesure.

Ce qu'il te faut : une carte bancaire (nom de domaine, environ 10-15 €/an),
tes accès à Vercel, Supabase, la console Anthropic et GitHub.

> Règle d'or : quand une étape demande de « redéployer », va dans Vercel →
> ton projet → Deployments → les trois points du dernier déploiement →
> **Redeploy**. Une variable d'environnement modifiée n'est prise en compte
> qu'après un redéploiement.

---

## Étape 1 — Le nom de domaine (≈ 20 min + attente)

- [ ] Acheter le domaine chez un registraire (OVHcloud, Namecheap, Gandi…).
      Un `.com` est le plus sûr pour un public international.
- [ ] Vercel → ton projet → **Settings → Domains** → *Add* → saisir le
      domaine (ex : `acadmatch.com`). Vercel propose aussi d'ajouter
      `www.acadmatch.com` : accepte, avec redirection vers le domaine
      principal.
- [ ] Vercel affiche les enregistrements DNS à créer (un `A` et un `CNAME`
      en général). Les créer **exactement** chez le registraire (zone DNS).
- [ ] Attendre que Vercel affiche « Valid Configuration » (quelques minutes
      à quelques heures). Le certificat HTTPS est automatique.

## Étape 2 — Donner l'adresse du site à l'application (≈ 5 min)

- [ ] Vercel → **Settings → Environment Variables** → ajouter
      `NEXT_PUBLIC_SITE_URL` = `https://acadmatch.com` (ton domaine, sans `/`
      final), environnement **Production** uniquement.
- [ ] Redéployer.
- [ ] Vérifier dans le navigateur : `https://acadmatch.com/sitemap.xml` et
      `https://acadmatch.com/robots.txt` doivent afficher **ton domaine**,
      plus l'adresse `vercel.app`. Si ce n'est pas le cas : le redéploiement
      n'a pas été fait après l'ajout de la variable.

## Étape 3 — Supabase : adresse, région, tables (≈ 15 min)

- [ ] Supabase → **Authentication → URL Configuration** :
  - **Site URL** = `https://acadmatch.com`
  - **Redirect URLs** : ajouter `https://acadmatch.com/**` (le `/**` est
    indispensable). Garder `http://localhost:3000/**`. L'ancienne adresse
    `vercel.app/**` peut rester.
- [ ] Supabase → **Project Settings → General** : noter la **région** du
      projet. La politique de confidentialité indique « Union européenne »
      pour Supabase. Si la région n'est pas en Europe (`eu-…`), me le
      signaler : le texte de `/confidentialite` doit être corrigé (on ne
      peut pas changer la région d'un projet existant).
- [ ] Supabase → **Table Editor** : vérifier que les tables `profiles`,
      `ai_usage`, `workspaces`, `feedback`, `formation_requests` et
      `journey_events` existent, et que le déclencheur anti-abus
      `throttle_feedback` est présent (Database → Triggers).
      Sinon, exécuter dans **SQL Editor**, dans l'ordre, les fichiers
      manquants de `supabase/migrations/` (0001 à 0010).
- [ ] Table `feedback` : supprimer les lignes de test envoyées pendant le
      développement (les plus anciennes, datées du 1er octobre 2026 dans la
      colonne `created_at`) : la table doit être vide au lancement.
- [ ] Sauvegardes : le plan gratuit de Supabase n'inclut pas de sauvegarde
      restaurable. Pour la bêta, c'est acceptable (les étudiants gardent
      aussi leurs données dans leur navigateur). Si tu passes au plan Pro
      plus tard, les sauvegardes quotidiennes sont incluses.

## Étape 4 — Les e-mails de connexion avec Resend (≈ 30 min + attente)

**Indispensable** : le serveur d'e-mails intégré de Supabase n'envoie que
quelques e-mails par heure. Sans cette étape, la plupart des étudiants ne
recevront jamais leur lien de connexion.

- [ ] Créer un compte sur [resend.com](https://resend.com).
- [ ] Resend → **Domains → Add Domain** → saisir ton domaine. Resend affiche
      des enregistrements DNS (TXT pour SPF et DKIM, MX pour les retours) :
      les créer chez le registraire, puis cliquer **Verify** dans Resend.
      Attendre le statut « Verified ».
- [ ] Resend → **API Keys → Create API Key** → nom `acadmatch-supabase`,
      permission « Sending access », limité à ton domaine. **Copier la clé**
      (elle ne s'affiche qu'une fois).
- [ ] Supabase → **Authentication → Emails → SMTP Settings** → activer
      *Enable Custom SMTP* et remplir :
  - Sender email : `noreply@acadmatch.com`
  - Sender name : `AcadMatch`
  - Host : `smtp.resend.com`
  - Port : `465`
  - Username : `resend`
  - Password : la clé Resend copiée juste avant
- [ ] Supabase → **Authentication → Rate Limits** : passer la limite d'envoi
      d'e-mails à au moins **100 par heure** (la valeur par défaut est basse).
- [ ] Supabase → **Authentication → Emails → Templates → Magic Link** :
      sujet « Votre connexion à AcadMatch », et remplacer tout le corps par :

      ```html
      <h2>Connexion à AcadMatch</h2>
      <p>Votre code de connexion : <strong style="font-size:22px;letter-spacing:4px">{{ .Token }}</strong></p>
      <p>Ou cliquez sur ce lien : <a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">me connecter</a></p>
      <p>Ce code et ce lien expirent rapidement. Si vous n'avez rien demandé, ignorez cet e-mail.</p>
      ```

      Le code à 6 chiffres sert quand l'étudiant lit ses e-mails sur son
      téléphone mais utilise AcadMatch sur un ordinateur ; le lien ramène
      directement à la page d'où il s'est connecté. Faire de même pour le
      modèle **Confirm signup** (premier compte).
- [ ] **Tester** : sur `https://acadmatch.com/compte`, demander un lien avec
      ton adresse depuis ton téléphone, l'ouvrir depuis ton ordinateur. Tu
      dois arriver connecté sur `/compte`. Vérifier aussi les spams.

- [ ] **Optionnel, recommandé : « Continuer avec Google »** (≈ 20 min).
  1. [console.cloud.google.com](https://console.cloud.google.com) → créer un
     projet « AcadMatch » → **APIs & Services → OAuth consent screen** :
     type *External*, nom AcadMatch, ton e-mail, ton domaine.
  2. **Credentials → Create credentials → OAuth client ID** → *Web
     application* → *Authorized redirect URIs* : l'adresse affichée par
     Supabase dans **Authentication → Providers → Google** (« Callback URL »).
  3. Supabase → **Authentication → Providers → Google** → activer, coller
     *Client ID* et *Client secret*.
  4. Vercel → variable `NEXT_PUBLIC_AUTH_GOOGLE` = `1` (Production) →
     **Redeploy**. Le bouton n'apparaît qu'avec cette variable : sans elle,
     rien ne casse.

## Étape 5 — L'IA et son budget (≈ 15 min)

- [ ] Console Anthropic → **API Keys** : utiliser une clé dédiée nommée
      `acadmatch` (pas celle de ton autre projet). Vérifier que c'est bien
      elle qui est dans Vercel (`ANTHROPIC_API_KEY`) : la console affiche la
      date de dernière utilisation de chaque clé.
- [ ] Console Anthropic → **Settings → Limits** : fixer une **limite de
      dépense mensuelle** (recommandé pour la bêta : 30 $).
- [ ] Console Anthropic → **Billing** : vérifier que le **rechargement
      automatique** (auto-reload) est **désactivé**.
- [ ] Vercel → Environment Variables → `AI_DAILY_BUDGET_USD` :
  - **Production** : `3` pendant la bêta (un import de relevé réserve au
    pire 0,40 $ puis ne coûte en réalité que quelques centimes ; 3 $/jour
    laissent passer une vingtaine d'étudiants actifs).
  - **Preview** : `0` (coupe l'IA sur les versions de test).
  - Mettre `0` en Production coupe toute l'IA instantanément après
    redéploiement : c'est l'interrupteur d'urgence.
- [ ] Redéployer.
- [ ] Suivi : la table `ai_usage` dans Supabase liste chaque appel et son
      coût réel.

## Étape 6 — Sécurité et hygiène (≈ 10 min)

- [ ] GitHub → ton dépôt → **Settings → General → Danger Zone → Change
      visibility → Private**. Vercel reste connecté, rien d'autre à faire.
      L'intégration continue (GitHub Actions) continue de fonctionner dans
      la limite gratuite.
- [ ] Vercel → Environment Variables : vérifier que `SUPABASE_SECRET_KEY` et
      `ANTHROPIC_API_KEY` ne commencent **pas** par `NEXT_PUBLIC_` (sinon
      elles seraient visibles dans le navigateur).
- [ ] Vercel → **Analytics** → activer *Web Analytics* si ce n'est pas fait
      (mesure d'audience sans cookie, déjà prévue dans le code et dans la
      politique de confidentialité).

## Étape 6 bis — Ton espace admin (≈ 10 min)

L'espace admin montre en direct (actualisé toutes les 30 secondes) le
parcours des visiteurs, les formations demandées, les avis sur les scores,
le coût de l'IA et ce qu'il faut revérifier dans le catalogue.

**Il n'est pas à l'adresse `/admin`** (n'importe quel robot essaie cette
adresse) : il est servi à une adresse secrète que toi seul connais.
`/admin` affiche une page introuvable, comme une adresse qui n'existe pas.
Et même avec l'adresse, il faut trois verrous : ton e-mail dans
`ADMIN_EMAILS`, ton mot de passe (connexion de moins de 12 heures), et le
code à 6 chiffres de ton téléphone (double vérification).

- [ ] Supabase → **SQL Editor** : exécuter
      `supabase/migrations/0009_admin_read_grants.sql` puis
      `supabase/migrations/0010_admin_actions.sql` (déjà fait le 2026-10-06).
- [ ] Supabase → **Authentication → Sign In / Providers → Email** :
      vérifier que **Email** est activé (connexion par mot de passe), et
      **Authentication → Multi-Factor** : vérifier que **TOTP (App
      Authenticator)** est activé (il l'est par défaut).
- [ ] Vercel → **Settings → Environment Variables**, environnement
      **Production** :
      - `ADMIN_EMAILS` = ton adresse de connexion (déjà fait) ;
      - `ADMIN_PATH` = ton adresse secrète, en minuscules, chiffres et
        tirets, 16 caractères minimum (par exemple celle de ton fichier
        `.env.local`). **Garde-la pour toi**, ne la mets dans aucun lien
        public, aucun message, aucun document partagé.
      Puis **Redeploy**.
- [ ] Si ton compte n'a pas encore de mot de passe (tu te connectais par
      code) : `/compte` → connecte-toi par code → carte **Mot de passe** →
      choisis-en un. (Ou « Mot de passe oublié » depuis la connexion.)
- [ ] Installer sur ton téléphone une application d'authentification :
      Google Authenticator, Microsoft Authenticator ou 2FAS.
- [ ] Ouvrir `https://<ton-domaine>/<ADMIN_PATH>` → se connecter (e-mail +
      mot de passe) → la première fois, scanner le QR code avec
      l'application et saisir le code affiché. Ensuite, à chaque connexion :
      mot de passe puis code du téléphone. Ajoute l'adresse à tes favoris.

**Téléphone perdu ?** Supabase → **Authentication → Users** → ton compte →
supprimer le facteur « AcadMatch admin ». À la connexion suivante, l'admin
te propose de scanner un nouveau QR code.

**Adresse secrète compromise ?** Change `ADMIN_PATH` sur Vercel et
redéploie : l'ancienne adresse devient introuvable immédiatement.

## Étape 7 — Obligations légales (≈ 30 min)

- [ ] **APDP (Bénin)** : l'éditeur du site réside au Bénin, et le site
      traite des données personnelles (comptes, relevés de notes importés).
      Faire la formalité auprès de l'Autorité de protection des données
      personnelles sur [apdp.bj](https://apdp.bj) (rubrique des formalités
      / déclarations). Tout ce qu'on te demandera est déjà rédigé sur la
      page `/confidentialite` : données collectées, finalités, durée de
      conservation, sous-traitants (Vercel, Supabase, Anthropic), droits
      des personnes. En cas de doute sur la formalité exacte, appeler ou
      écrire à l'APDP.
- [ ] Relire `/mentions-legales`, `/confidentialite` et `/conditions` sur le
      site en ligne. Si tu veux une adresse de contact sur ton domaine
      (`contact@acadmatch.com`) au lieu de ton Gmail, me le demander : elle
      se change à un seul endroit (`data/legal.ts`).

## Étape 8 — Référencement Google et Bing (≈ 15 min)

- [ ] [Google Search Console](https://search.google.com/search-console) →
      *Ajouter une propriété* → type **Domaine** → saisir `acadmatch.com` →
      copier l'enregistrement **TXT** proposé → le créer chez le registraire
      → *Valider*.
- [ ] Search Console → **Sitemaps** → saisir `sitemap.xml` → *Envoyer*.
- [ ] Search Console → **Inspection de l'URL** → pour chacune de ces pages,
      coller l'adresse puis *Demander l'indexation* :
  - `https://acadmatch.com/`
  - `https://acadmatch.com/guides`
  - `https://acadmatch.com/guides/etudes-en-france/benin`
  - `https://acadmatch.com/formations`
- [ ] [Bing Webmaster Tools](https://www.bing.com/webmasters) → se connecter
      → **Importer depuis Google Search Console** (un clic). Bing alimente
      aussi DuckDuckGo et plusieurs assistants IA.

## Étape 9 — Vérification finale sur téléphone (≈ 20 min)

Sur ton téléphone, en navigation privée, sur `https://acadmatch.com` :

- [ ] L'accueil s'affiche, le menu s'ouvre, aucune page ne déborde sur le
      côté.
- [ ] `/profil` : les 3 étapes, l'aperçu des résultats apparaît dès la
      première matière, « Voir mes résultats » mène à la recherche.
- [ ] Un résultat : verdict, 3 actions, détails repliables.
- [ ] Connexion par lien e-mail (étape 4), puis import d'un vrai relevé de
      notes : les matières sont proposées, la moyenne est lue.
- [ ] Dans `/visa`, répondre « hors UE » et « Bénin », suivre un master
      français, puis ouvrir `/calendrier` : le calendrier Campus France Bénin
      s'affiche.
- [ ] Un guide (ex : `/guides/cout-des-etudes-en-france`) et une page domaine
      (ex : `/domaines/informatique`).
- [ ] Partager le lien de l'accueil dans WhatsApp : l'aperçu (image + titre)
      s'affiche.

## Étape 10 — Bêta fermée

- [ ] Inviter 10 à 20 étudiants (idéalement des profils variés : licence et
      master, plusieurs domaines, plusieurs pays).
- [ ] Leur demander de cliquer sur « Votre avis » en bas des résultats : les
      réponses arrivent dans la table `feedback` de Supabase.
- [ ] Chaque jour de la première semaine : regarder `ai_usage` (coûts) et
      `feedback` (avis).
- [ ] Après 4 à 6 semaines : Search Console → *Performances* (requêtes qui
      amènent du trafic) et *Signaux Web essentiels* (vitesse réelle).

---

## Optionnel — demande une petite intégration de code

À ne **pas** activer seul : ces options exigent une modification du code,
sinon elles cassent quelque chose.

- **CAPTCHA à la connexion** (Supabase → *Bot and Abuse Protection*) : si tu
  l'actives sans que le code envoie le jeton, **plus personne ne pourra se
  connecter**. Utile seulement si des comptes sont créés en masse ; le
  budget IA protège déjà le coût.
- **Sentry** (alertes d'erreurs) : demande d'installer le module, d'ouvrir
  son adresse dans la politique de sécurité (CSP) et de l'ajouter à la
  politique de confidentialité. Pour la bêta, les journaux de Vercel
  (Deployments → *Logs*) suffisent.

## En cas de problème

| Symptôme | Cause probable | Solution |
|---|---|---|
| Le lien de connexion ramène sur l'accueil sans connecter | Redirect URL sans `/**` | Étape 3 |
| Aucun e-mail de connexion reçu | SMTP non configuré, domaine non vérifié, ou spam | Étape 4 ; regarder Resend → *Logs* |
| Le lien ne marche que dans le même navigateur | Modèle d'e-mail non modifié | Étape 4, modèle Magic Link |
| Toutes les fonctions IA affichent « erreur » | Migration 0003 absente ou `SUPABASE_SECRET_KEY` manquante | Étapes 3 et 5 |
| « L'IA est très demandée aujourd'hui » | Budget quotidien atteint | Monter `AI_DAILY_BUDGET_USD` et redéployer |
| Erreur « Invalid path » de Supabase | URL Supabase collée avec `/rest/v1/` | Garder seulement `https://xxxx.supabase.co` |
| Le plan du site affiche encore `vercel.app` | Pas de redéploiement après l'étape 2 | Redéployer |

## Après le lancement

L'entretien annuel des données (calendriers en octobre et en hiver, frais
en juillet) est décrit dans `docs/seo.md` (« Entretien ») et
`docs/data-sourcing.md`.
