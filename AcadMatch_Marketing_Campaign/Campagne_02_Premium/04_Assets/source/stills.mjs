// Relecture rapide : capture quelques instants d'une scène en une planche PNG,
// sans exporter toute la vidéo. Usage : node stills.mjs v2-demo 1.5 4 9 ...
import { chromium } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const [name, ...times] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(join(here, "scenes", `${name}.html`)).href);
page.on("pageerror", (e) => console.error("Erreur :", e.message));
await page.evaluate(async () => { await document.fonts.ready; await window.SCENE.ready(); });
const shots = [];
for (const t of times) {
  await page.evaluate(async (x) => { window.SCENE.render(x); await window.SCENE.ready(); }, Number(t));
  shots.push((await page.screenshot({ type: "jpeg", quality: 80 })).toString("base64"));
}
const sheet = await browser.newPage({ viewport: { width: 360 * times.length, height: 640 } });
await sheet.setContent(`<body style="margin:0;display:flex;background:#000">${shots.map((b, i) => `<div style="position:relative"><img src="data:image/jpeg;base64,${b}" style="width:360px;height:640px;display:block"><span style="position:absolute;top:6px;left:8px;color:#fff;font:24px sans-serif;background:#0008;padding:2px 6px">${times[i]}s</span></div>`).join("")}</body>`);
const out = join(here, "..", "review", `${name}-stills-${times[0]}.png`);
await sheet.screenshot({ path: out });
await browser.close();
console.log(out);
