# Sourcing et vérification des données du catalogue

Ce document formalise une pratique déjà suivie depuis l'Étape 3 (catalogue
France) mais jusqu'ici seulement tribale (répétée à chaque session, jamais
écrite) : comment ajouter ou revérifier une formation sans jamais inventer
de donnée. À suivre pour **tout** pays, pas seulement la France — c'est la
raison d'être de ce document avant l'ajout d'un deuxième pays (voir la
roadmap, phase "architecture internationale").

## Règle absolue

**Aucune formation, aucun prérequis, aucune URL n'est inventé.** Si une
information ne peut pas être confirmée sur la page officielle au moment de
la vérification, le champ le dit explicitement (ex :
`applicationProcedure: "à vérifier directement sur le site officiel"`)
plutôt que d'improviser une valeur plausible. Une donnée absente et signalée
comme telle est toujours préférable à une donnée fausse et silencieuse.

## Checklist pour ajouter une formation

1. **Trouver la page officielle** de l'établissement décrivant la formation
   (admission, maquette, contenu). Ce doit être un domaine appartenant à
   l'établissement lui-même — pas un agrégateur tiers, pas un forum, pas un
   classement.
2. **Lire la page en entier** avant de remplir la fiche. Ne synthétiser que
   ce qui y est réellement écrit.
3. **Remplir les champs obligatoires** (`types/index.ts`, `StudyProgram`) :
   `name`, `institution.name`, `institution.city`, `institution.country`,
   `level`, `goal`, `field`, `description`, `prerequisites`, `coreCourses`,
   `skills`, `requiredLevel`, `language`, `applicationProcedure`, `source`
   (URL HTTPS de la page consultée).
4. **Marquer la vérification** : `demo: false`, `verifiedAt` (date du jour,
   `YYYY-MM-DD`), `verificationStatus: "vérifiée"`.
5. **Ne jamais mélanger démo et réel** : une fiche de démonstration reste
   `demo: true` avec une URL sous `https://demo.acadmatch.fr/...`, jamais
   affichée comme un lien cliquable côté UI (voir `DemoDataBadge`).
6. **Lancer les vérifications automatiques** avant de committer :
   ```bash
   npm run audit:catalogue      # intégrité de la donnée (dates, pays, doublons, HTTPS...)
   python scripts/audit_sources.py   # les URL sources répondent-elles bien (pas de 404) ?
   npm run test                 # régressions du moteur/recherche/intégrité
   ```

## `institution.country`

Ajouté en Phase 1 (architecture internationale) pour remplacer un pays
jusque-là implicite (toujours la France). Chaîne normalisée en clair
(`"France"`, `"Belgique"`, ...), pas un code ISO — cohérent avec le reste du
fichier de types, qui privilégie des chaînes lisibles à des enums stricts
tant qu'un seul pays est réellement au catalogue. Un futur deuxième pays
introduira ses propres valeurs, jamais une correction rétroactive du pays
d'une formation déjà vérifiée sans re-vérification de la fiche elle-même.

## Cadence de revérification

Une fiche vérifiée devient automatiquement **"à revérifier"** après
`VERIFICATION_MAX_AGE_DAYS` (180 jours, `lib/data/integrity.ts`), même sans
changement manuel — voir `effectiveVerificationStatus`. `npm run
audit:catalogue` liste ces fiches sans échouer le build (la staleness est un
signal à traiter, pas une erreur bloquante) ; `npm run test` échoue en
revanche sur toute erreur bloquante (source non HTTPS, identité incomplète,
`verifiedAt` invalide, doublon de source...).

## Étendre à un nouveau pays

Avant d'ajouter la première formation d'un pays donné :

1. Identifier la (ou les) plateforme(s) de candidature officielle(s) de ce
   pays (équivalent de Parcoursup/Mon Master pour la France) — elle
   détermine le contenu réaliste d'`applicationProcedure`.
2. Vérifier que la langue de la page officielle est comprise par la
   personne (ou l'agent) qui saisit la fiche — en cas de doute sur une
   traduction, préférer signaler l'incertitude plutôt que de deviner (même
   principe que la règle absolue ci-dessus).
3. Ne dupliquer aucune règle de scoring : le moteur de matching
   (`lib/matching/engine.ts`) reste académique et indépendant du pays —
   seules les données (`Institution`, `applicationProcedure`) changent.
