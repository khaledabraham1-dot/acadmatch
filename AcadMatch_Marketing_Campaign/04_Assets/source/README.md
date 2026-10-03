# Studio vidéo AcadMatch — sources et regénération

Tout est reproductible depuis ce dossier, sans logiciel payant : Chromium
(Playwright, déjà dans le projet), ffmpeg (fourni par le paquet Python
`imageio-ffmpeg`) et Python standard.

## Chaîne de production

| Étape | Fichier | Rôle |
|---|---|---|
| 1. Captures réelles | `capture-ui.mjs` | Photographie l'interface du build de production (`npx next start -p 3300`) dans `../ui/` |
| 2. Scènes | `scenes/v*.html` + `runtime.js` + `campaign.css` | Animation 1080 × 1920 entièrement calculée à partir du temps t (déterministe) |
| 3. Image | `render.mjs <scène>` | Exporte chaque image via Chromium et l'encode en H.264 (`../renders/`) |
| 4. Son | `synth.py <scène>` | Musique et effets synthétisés de zéro (`../audio/*.wav`) |
| 5. Mixage | `mux.mjs <scène> <nom-final>` | Image + son, volume −14 LUFS, fondu → `01_Videos_Finales/` |
| Relecture | `stills.mjs <scène> t1 t2…`, `contact-sheet.sh` | Planches d'images clés sans export complet |
| Storyboards | `storyboard.mjs` + `shots.json` | Planches commentées depuis les vidéos finales → `03_Storyboards/` |

## Regénérer une vidéo (depuis la racine du projet)

```bash
node AcadMatch_Marketing_Campaign/04_Assets/source/render.mjs v3-15-decembre
python AcadMatch_Marketing_Campaign/04_Assets/source/synth.py v3-15-decembre
node AcadMatch_Marketing_Campaign/04_Assets/source/mux.mjs v3-15-decembre 03_AcadMatch_15-decembre
```

Scènes : `v1-onglets`, `v2-demo`, `v3-15-decembre`, `v4-jury`, `v5-conversion`.
Compter 2 à 4 minutes d'export par vidéo.

Relire une scène en temps réel : ouvrir `scenes/<scène>.html#preview` dans
Chrome.

## Modifications courantes

- **Mettre l'adresse du site sur la carte de fin** (une fois le domaine en
  ligne) : dans chaque scène, `Studio.endCard({ …, cta: "acadmatch.com" })`
  remplace « Lien en bio », puis regénérer.
- **Mettre à jour une capture** (interface modifiée) : relancer
  `capture-ui.mjs`, puis regénérer les vidéos concernées.
- **Changer un texte** : il est dans le HTML de la scène ; les temps
  d'apparition sont dans `render(t)`, commentés par séquence.
- **Musique** : chaque vidéo a sa fonction `spec_*` dans `synth.py` (tempo,
  accords, effets calés sur les temps de la scène).

## Règles de la campagne

- Uniquement des captures réelles de l'interface ; aucune fonctionnalité,
  statistique ou promesse inventée.
- Dates et montants identiques aux données sourcées du site
  (`data/campaigns.ts`, `data/budget.ts`).
- Textes dans la zone sûre des réseaux sociaux (y = 200 à 1 500 px, marges de
  72 px).
