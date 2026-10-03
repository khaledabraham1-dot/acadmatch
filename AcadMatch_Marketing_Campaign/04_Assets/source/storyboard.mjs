// Storyboards : images clés extraites des vidéos FINALES + description de chaque plan.
// Usage : node storyboard.mjs   (écrit 03_Storyboards/<vidéo>_storyboard.png)
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const ffmpeg = execFileSync("python", ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"]).toString().trim();
const shots = JSON.parse(readFileSync(join(here, "shots.json"), "utf8"));
const tmp = mkdtempSync(join(tmpdir(), "acadmatch-sb-"));
// Polices intégrées en base64 : une page créée par setContent ne peut pas lire de fichier local.
const font = (f) => `url(data:font/woff2;base64,${readFileSync(join(root, "04_Assets", "fonts", f)).toString("base64")})`;

const browser = await chromium.launch();
for (const [file, sb] of Object.entries(shots)) {
  const frames = sb.shots.map((shot, i) => {
    const out = join(tmp, `${file}-${i}.jpg`);
    execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-ss", String(shot.t), "-i", join(root, "01_Videos_Finales", `${file}.mp4`), "-frames:v", "1", "-vf", "scale=360:-1", "-q:v", "3", out]);
    return readFileSync(out).toString("base64");
  });
  const cols = Math.min(5, sb.shots.length);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:Figtree;src:${font("Figtree-Variable.woff2")};font-weight:300 900}
    @font-face{font-family:Unbounded;src:${font("Unbounded-Variable.woff2")};font-weight:200 900}
    body{margin:0;padding:56px;background:#f3f5f4;font-family:Figtree;color:#0d1b16;width:${cols * 400 + 112 - 40}px}
    h1{font-family:Unbounded;letter-spacing:-.04em;font-size:44px;margin:0}
    .angle{color:#0a7d55;font-weight:800;font-size:22px;text-transform:uppercase;letter-spacing:.12em;margin:8px 0 36px}
    .grid{display:grid;grid-template-columns:repeat(${cols},360px);gap:40px}
    .shot img{width:360px;height:640px;border-radius:22px;display:block;box-shadow:0 18px 40px rgba(13,27,22,.18)}
    .n{font-weight:800;font-size:22px;margin:16px 0 4px}.n span{color:#0a7d55;margin-right:8px}
    .d{font-size:19px;line-height:1.4;color:#33413b}.t{font-size:16px;color:#5b6a63;margin-top:6px}
  </style></head><body><h1>${sb.title}</h1><div class="angle">${sb.angle}</div><div class="grid">${sb.shots
    .map((s, i) => `<div class="shot"><img src="data:image/jpeg;base64,${frames[i]}"><div class="n"><span>${String(i + 1).padStart(2, "0")}</span>${s.name}</div><div class="d">${s.desc}</div><div class="t">${s.t.toFixed(1)} s</div></div>`)
    .join("")}</div></body></html>`;
  const page = await browser.newPage({ viewport: { width: cols * 400 + 72, height: 800 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, "03_Storyboards", `${file}_storyboard.png`), fullPage: true });
  await page.close();
  console.log("OK", file);
}
await browser.close();
