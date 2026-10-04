// Export v2 : attend le décodage des images de clips avant chaque capture ;
// option --blur : rendu à 60 i/s fusionné deux à deux en 30 i/s (flou de mouvement).
// Usage (racine du projet) : node .../render2.mjs <scène> [--blur] [--from s --to s]
import { chromium } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
const blur = process.argv.includes("--blur");
const arg = (flag, fallback) => { const i = process.argv.indexOf(flag); return i > 0 ? Number(process.argv[i + 1]) : fallback; };
const ffmpeg = execFileSync("python", ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"]).toString().trim();
const scene = join(here, "scenes", `${name}.html`);
if (!existsSync(scene)) throw new Error(`Scène introuvable : ${scene}`);
const outDir = join(here, "..", "renders");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${name}_silent.mp4`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", (e) => console.error("Erreur de scène :", e.message));
await page.goto(pathToFileURL(scene).href);
await page.evaluate(async () => { await document.fonts.ready; await window.SCENE.ready(); });
const { duration } = await page.evaluate(() => ({ duration: window.SCENE.duration }));
const fps = blur ? 60 : 30;
const from = arg("--from", 0), to = Math.min(arg("--to", duration), duration);
const frames = Math.round((to - from) * fps);
// Flou de mouvement : moyenne de 2 images consécutives à 60 i/s, puis une image sur deux → 30 i/s.
const vf = blur ? ["-vf", "tmix=frames=2:weights=1 1,framestep=2,setpts=N/30/TB", "-r", "30"] : [];
const enc = spawn(ffmpeg, ["-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(fps), "-i", "-", ...vf,
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.2", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
const started = Date.now();
for (let i = 0; i < frames; i++) {
  await page.evaluate(async (t) => { window.SCENE.render(t); await window.SCENE.ready(); }, from + i / fps);
  const jpg = await page.screenshot({ type: "jpeg", quality: 92 });
  if (!enc.stdin.write(jpg)) await new Promise((r) => enc.stdin.once("drain", r));
  if (i % 90 === 0) process.stdout.write(`\r${name} : ${i}/${frames}`);
}
enc.stdin.end();
await new Promise((res, rej) => enc.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`)))));
await browser.close();
console.log(`\r${name} : ${frames} images (${fps} i/s${blur ? ", flou de mouvement" : ""}) en ${Math.round((Date.now() - started) / 1000)} s`);
