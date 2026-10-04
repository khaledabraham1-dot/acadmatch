// Les scènes s'ouvrent en file:// (lecture de JSON impossible) : on regroupe
// les clip.json dans scenes/clips.js, chargé par une simple balise <script>.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "ui_clips");
const index = {};
for (const name of readdirSync(dir)) {
  const f = join(dir, name, "clip.json");
  if (existsSync(f)) index[name] = JSON.parse(readFileSync(f, "utf8"));
}
// Minutages des voix off (voix/*_mots.json), pour les sous-titres synchronisés.
const voices = {};
const vdir = join(here, "..", "voix");
for (const f of readdirSync(vdir).filter((x) => x.endsWith("_mots.json"))) voices[f.replace("_mots.json", "")] = JSON.parse(readFileSync(join(vdir, f), "utf8")).mots;
writeFileSync(join(here, "scenes", "clips.js"), `window.CLIPS = ${JSON.stringify(index)};\nwindow.VOICES = ${JSON.stringify(voices)};\n`);
console.log("OK clips.js :", Object.keys(index).join(", "));
