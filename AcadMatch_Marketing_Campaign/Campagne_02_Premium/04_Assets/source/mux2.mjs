// Mixage v2 : image + musique + voix off optionnelle (la musique s'efface sous la voix),
// −14 LUFS, fondus. Usage : node .../mux2.mjs <scène> <nom-final> [voix.mp3 décalage_s]
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const [name, finalName, voice, offset = "0"] = process.argv.slice(2);
const ffmpeg = execFileSync("python", ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"]).toString().trim();
const video = join(here, "..", "renders", `${name}_silent.mp4`);
const music = join(here, "..", "audio", `${name}.wav`);
const out = join(here, "..", "..", "01_Videos_Finales", `${finalName}.mp4`);
const info = spawnSync(ffmpeg, ["-hide_banner", "-i", video], { encoding: "utf8" }).stderr;
const [, h, m, s] = info.match(/Duration: (\d+):(\d+):([\d.]+)/);
const d = Number(h) * 3600 + Number(m) * 60 + Number(s);
const ms = Math.round(Number(offset) * 1000);
const tail = `afade=t=in:d=0.05,afade=t=out:st=${(d - 0.7).toFixed(2)}:d=0.7`;
const filter = voice
  ? `[2:a]aresample=48000,adelay=${ms}|${ms},apad,asplit=2[vk][vm];[1:a]aresample=48000[m];` +
    `[m][vk]sidechaincompress=threshold=0.025:ratio=9:attack=15:release=450[duck];` +
    `[duck][vm]amix=inputs=2:duration=first:normalize=0,atrim=0:${d},loudnorm=I=-14:TP=-1.5:LRA=11,${tail}[a]`
  : `[1:a]aresample=48000,atrim=0:${d},loudnorm=I=-14:TP=-1.5:LRA=11,${tail}[a]`;
const args = ["-y", "-loglevel", "error", "-i", video, "-i", music, ...(voice ? ["-i", join(here, "..", "voix", voice)] : []),
  "-filter_complex", filter, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-t", String(d), out];
const r = spawnSync(ffmpeg, args, { stdio: "inherit" });
if (r.status !== 0) throw new Error("Échec du mixage");
console.log(`OK ${out} (${d.toFixed(2)} s)`);
