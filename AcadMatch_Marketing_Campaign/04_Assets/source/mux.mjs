// Mixage final : image (render.mjs) + bande-son (synth.py), volume normalisé à −14 LUFS
// (recommandation TikTok / Instagram / YouTube), fondu de fin, export dans 01_Videos_Finales.
// Usage : node mux.mjs v5-conversion 05_AcadMatch_Ta-licence-suffit
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const [name, finalName] = process.argv.slice(2);
if (!name || !finalName) throw new Error("Usage : node mux.mjs <scène> <nom-final>");
const ffmpeg = execFileSync("python", ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"]).toString().trim();
const video = join(here, "..", "renders", `${name}_silent.mp4`);
const audio = join(here, "..", "audio", `${name}.wav`);
const out = join(here, "..", "..", "01_Videos_Finales", `${finalName}.mp4`);

// Durée de l'image (ffmpeg écrit les infos du fichier sur stderr).
const info = spawnSync(ffmpeg, ["-hide_banner", "-i", video], { encoding: "utf8" }).stderr;
const [, h, m, s] = info.match(/Duration: (\d+):(\d+):([\d.]+)/);
const duration = Number(h) * 3600 + Number(m) * 60 + Number(s);

const run = spawnSync(ffmpeg, [
  "-y", "-loglevel", "error",
  "-i", video, "-i", audio,
  "-filter_complex",
  `[1:a]atrim=0:${duration},loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:d=0.05,afade=t=out:st=${(duration - 0.7).toFixed(2)}:d=0.7[a]`,
  "-map", "0:v", "-map", "[a]",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
  "-movflags", "+faststart", "-t", String(duration),
  out,
], { stdio: "inherit" });
if (run.status !== 0) throw new Error("Échec du mixage");
console.log(`OK ${out} (${duration.toFixed(2)} s)`);
