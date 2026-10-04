# Studio v2 — regénérer la campagne 02

| Étape | Fichier | Rôle |
|---|---|---|
| 1. Tournage | `capture-clips.mjs` | Filme la vraie application (`npx next start -p 3300`) image par image : saisies, autocomplétion, clics (positions enregistrées) → `../ui_clips/<clip>/` |
| 2. Index | `build-clips-index.mjs` | Regroupe les `clip.json` et les minutages de voix dans `scenes/clips.js` |
| 3. Voix | `voice_timing.py`, `voice_manifeste.py` | Minutage mot à mot (edge-tts) ; vérifié sur les silences du fichier imposé |
| 4. Scènes | `scenes/p*.html` + `studio2.js` + `studio2.css` | Animation calculée à partir du temps t : clips réels, caméra, taps, sous-titres synchronisés |
| 5. Image | `render2.mjs <scène> --blur` | 60 i/s fusionnés en 30 i/s (flou de mouvement) → `../renders/` |
| 6. Son | `synth.py <scène>` | Musique et effets synthétisés, calés sur la scène → `../audio/` |
| 7. Mixage | `mux2.mjs <scène> <nom> [voix.mp3 décalage]` | Image + musique (+ voix, la musique s'efface sous elle), −14 LUFS |
| Relecture | `stills.mjs <scène> t1 t2…` | Planche d'images clés sans export |
| Storyboards | `storyboard.mjs` + `shots.json` | Planches depuis les vidéos finales |

Exemple (racine du projet) :

```bash
node AcadMatch_Marketing_Campaign/Campagne_02_Premium/04_Assets/source/render2.mjs p1-aicha-voix --blur
python AcadMatch_Marketing_Campaign/Campagne_02_Premium/04_Assets/source/synth.py p1-aicha-voix
node AcadMatch_Marketing_Campaign/Campagne_02_Premium/04_Assets/source/mux2.mjs p1-aicha-voix 01_AcadMatch_Aicha_voix voix_VivienneMultilingualNeural.mp3 0.6
```

Compter 10 à 16 minutes de rendu par vidéo de 30 s (chaque image de clip réel est décodée à la volée).

**Remplacer la voix par un enregistrement humain** (par exemple un étudiant béninois) : déposer le fichier dans `../voix/`, refaire le minutage (outil de sous-titrage ou à la main dans un `*_mots.json`), puis `mux2.mjs` avec le nouveau fichier.

**Mettre l'adresse du site** : `Studio.endCard(…, { cta: "acadmatch.com" })` dans chaque scène, puis regénérer.
