// Export image par image d'une scène HTML vers une vidéo H.264 1080 × 1920.
// Usage : node render.mjs v1-onglets [--from 0 --to 3]   (à lancer depuis la racine du projet)
// Le navigateur calcule chaque image via SCENE.render(t) : rendu déterministe,
// fluide quelle que soit la puissance de la machine.
import { chromium } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) throw new Error("Usage : node render.mjs <scène>");
const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? Number(process.argv[i + 1]) : fallback;
};

const ffmpeg = execFileSync("python", ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"]).toString().trim();
const scene = join(here, "scenes", `${name}.html`);
if (!existsSync(scene)) throw new Error(`Scène introuvable : ${scene}`);
const outDir = join(here, "..", "renders");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${name}_silent.mp4`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(scene).href);
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => (img.onload = img.onerror = r)))));
});
const { duration, fps } = await page.evaluate(() => ({ duration: window.SCENE.duration, fps: window.SCENE.fps }));
const from = arg("--from", 0);
const to = Math.min(arg("--to", duration), duration);
const frames = Math.round((to - from) * fps);

const enc = spawn(ffmpeg, [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(fps), "-i", "-",
  "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
  "-profile:v", "high", "-level", "4.2", "-movflags", "+faststart",
  out,
], { stdio: ["pipe", "inherit", "inherit"] });

const started = Date.now();
for (let i = 0; i < frames; i++) {
  const t = from + i / fps;
  await page.evaluate((time) => window.SCENE.render(time), t);
  const jpg = await page.screenshot({ type: "jpeg", quality: 94 });
  if (!enc.stdin.write(jpg)) await new Promise((r) => enc.stdin.once("drain", r));
  if (i % 60 === 0) process.stdout.write(`\r${name} : ${i}/${frames} images`);
}
enc.stdin.end();
await new Promise((resolve, reject) => enc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}`)))));
await browser.close();
console.log(`\r${name} : ${frames} images en ${Math.round((Date.now() - started) / 1000)} s → ${out}`);
