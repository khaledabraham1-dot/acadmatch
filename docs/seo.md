# Référencement (SEO) d'AcadMatch

État au 2026-10-03. Ce document explique la stratégie, ce qui est en place,
la checklist du jour de la mise en ligne et l'entretien annuel.

## Stratégie

Public visé : étudiants francophones hors UE (Afrique de l'Ouest et
centrale, Maghreb) qui visent une licence ou un master en France ou en
Belgique. Ils ne cherchent pas « AcadMatch » : ils tapent des questions de
procédure, de calendrier et de coût. Le site répond à ces questions avec des
pages construites sur ses données sourcées, puis amène vers l'outil.

Principes :

- **Qualité plutôt que volume.** Aucune page générée en masse : pas de page
  par pays sans calendrier officiel relevé (contenu dupliqué = pages
  « satellites » pénalisées par Google). Une page domaine sous 3 formations
  existe mais reste en `noindex`.
- **Tout dérive des données.** Montants, dates, listes de formations et FAQ
  sont calculés depuis `data/` : une mise à jour des données met à jour
  toutes les pages, sans texte figé qui se périme.
- **Sources visibles et datées** sur chaque guide (signal de fiabilité pour
  Google et pour les assistants IA qui citent leurs sources).

## Recherche de mots-clés (autocomplétion Google, 2026-10-02)

| Intention | Requêtes observées | Page qui répond |
|---|---|---|
| Calendrier Campus France par pays | campus france bénin 2027, campus france bénin calendrier 2026, campus france sénégal date limite, campus france cameroun calendrier | `/guides/etudes-en-france/[pays]` (Bénin aujourd'hui) |
| Procédure Études en France | etudes en france, etudes en france bénin, etudier en france campus france, eef campus france | `/guides/etudes-en-france` |
| Master pour étranger | master en france pour les étrangers, master en france prix, mon master campus france, admission master | `/guides/master-en-france-etudiant-etranger` |
| Licence après le bac | étudier en france après le bac, parcoursup étranger, procédure dap, procédure dap campus france | `/guides/licence-en-france-apres-un-bac-etranger` |
| Belgique | étudier en belgique procédure, étudier en belgique pour étranger, master en belgique pour les étrangers (prix) | `/guides/etudier-en-belgique` |
| Coût | frais de scolarité france étudiant étranger, coût études france, visa étudiant france ressources | `/guides/cout-des-etudes-en-france` |
| Équivalence | équivalence diplôme bénin, équivalence diplôme étranger | `/guides/equivalence-diplome-etranger` |
| Prérequis par domaine | prérequis master, prérequis master finance, comment choisir son master en droit | `/domaines/[slug]` |
| Formation précise | nom de la formation + prérequis / admission | `/formations/[id]` |

Prochaines pistes, quand les données existent : une page calendrier par
pays Campus France (Sénégal, Cameroun, Côte d'Ivoire, Maroc…) dès que leur
calendrier officiel est relevé dans `data/campaigns.ts` (la page se crée
seule) ; « lettre de motivation Campus France » et « entretien Campus
France » sont très demandés mais exigent un contenu méthodologique
irréprochable, à écrire avec un vrai retour d'expérience.

## Ce qui est en place

- **Pages indexables** : accueil, `/formations` + 48 fiches, 10 pages
  domaine (9 indexées), `/guides` + 6 guides + 1 page pays, `/methode`,
  `/profil`, `/recherche`, `/visa`, pages légales.
- **Pages personnelles en `noindex`** (espace, candidatures, résultat,
  calendrier, compte, IA) et `/api/`, `/auth/` exclus dans `robots.txt`.
- **Métadonnées** : titre unique ≤ 62 caractères et description unique de
  70 à 160 caractères sur chaque page éditoriale (vérifié par
  `lib/seo/seo.test.ts`), URL canonique, aperçu de partage (Open Graph).
- **Données structurées** : `WebSite` + `Organization` (logo `/logo.png`)
  sur l'accueil ; `EducationalOccupationalProgram` + fil d'Ariane + FAQ sur
  les fiches ; `ItemList` + fil d'Ariane + FAQ sur les domaines ; `Article`
  + fil d'Ariane + FAQ sur les guides.
- **Maillage interne** : accueil (pied de page) → guides et domaines ;
  catalogue → domaines ; domaine ↔ fiches ; fiche → domaine et guides
  utiles ; guides ↔ guides, fiches et domaines ; menu « Guides ».
- **Plan du site** `/sitemap.xml` avec dates de dernière vérification.
- **Contrôles automatiques** : `lib/seo/seo.test.ts` (titres, descriptions,
  plan du site) et `e2e/seo.spec.ts` (rendu serveur, un seul h1, canonique,
  JSON-LD valide, mobile 360 px), accessibilité axe sur les nouvelles pages.
- **Performance (Lighthouse mobile, local)** : SEO 100, bonnes pratiques
  100, accessibilité 100, performance 92-94 en mesure simulée ; pages
  statiques (HTML ≈ 14 Ko et CSS ≈ 10 Ko compressés).

## Jour de la mise en ligne (≈ 15 minutes)

1. Acheter le domaine, le brancher sur Vercel.
2. Vercel → Settings → Environment Variables : `NEXT_PUBLIC_SITE_URL` =
   `https://votre-domaine` (Production), puis redéployer. Canoniques, plan
   du site, robots et images de partage suivent automatiquement.
3. Vérifier : `https://votre-domaine/sitemap.xml` et `/robots.txt`
   affichent bien le nouveau domaine.
4. **Google Search Console** : ajouter la propriété « Domaine » (validation
   par enregistrement DNS chez le registraire), puis Sitemaps → soumettre
   `sitemap.xml`. Inspection d'URL → demander l'indexation de l'accueil, de
   `/guides` et de `/guides/etudes-en-france/benin`.
5. **Bing Webmaster Tools** : « Importer depuis Google Search Console »
   (un clic) ; Bing alimente aussi DuckDuckGo et des assistants IA.
6. Supabase → Authentication → URL Configuration : mettre le nouveau
   domaine en Site URL et dans les Redirect URLs (`/**`).
7. Après 4 à 6 semaines : Search Console → « Signaux Web essentiels » pour
   les vraies mesures de vitesse sur mobile, et « Performances » pour voir
   les requêtes qui amènent du trafic (à comparer au tableau ci-dessus).

## Entretien

| Quand | Quoi | Où |
|---|---|---|
| Chaque 1er octobre | Calendrier Études en France du pays (et d'autres pays si possible) | `data/campaigns.ts` |
| Décembre-février | Arrêtés Parcoursup et Mon Master de la nouvelle session | `data/campaigns.ts` |
| Chaque juillet | Droits d'inscription, CVEC, ressources visa, frais belges | `data/budget.ts` (voir `docs/data-sourcing.md`) |
| Après chaque changement | Mettre à jour `GUIDES_UPDATED_AT` | `lib/seo/guides.ts` |
| Tous les trimestres | Search Console : erreurs d'indexation, requêtes en hausse | — |

Le test de bout en bout « calendrier : un résident du Bénin… » échoue après
le 31 mai 2027 : c'est le rappel de relever le calendrier suivant.
