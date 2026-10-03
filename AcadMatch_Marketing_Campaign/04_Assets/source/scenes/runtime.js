/*
 * Moteur d'animation de la campagne : tout est fonction du temps t (secondes).
 * Aucune animation CSS ni minuterie : render(t) calcule l'état exact de chaque
 * image, ce qui rend l'export image par image déterministe (render.mjs).
 * Une scène appelle Studio.scene({ duration, render }) ; ouvrir le fichier HTML
 * dans un navigateur avec #preview la joue en temps réel pour la relire.
 */
(function () {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = {
    linear: (x) => x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inCubic: (x) => x * x * x,
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outExpo: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inExpo: (x) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10)),
    outBack: (x) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    },
    outQuint: (x) => 1 - Math.pow(1 - x, 5),
  };
  /** Progression 0→1 entre a et b (secondes), avec courbe. */
  const p = (t, a, b, curve = ease.outCubic) => curve(clamp((t - a) / (b - a)));
  /** Fenêtre de visibilité : entrée [a, a+fi], sortie [b-fo, b]. Renvoie 0→1→0. */
  const win = (t, a, b, fi = 0.35, fo = 0.3) => Math.min(p(t, a, a + fi), 1 - p(t, b - fo, b, ease.inCubic));

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  function style(el, s) {
    if (!el) return;
    for (const k in s) el.style[k] = s[k];
  }

  /** Découpe le texte d'un élément en mots animables (.w), en gardant <b>/<span class> autour des mots. */
  function splitWords(el) {
    if (el.dataset.split) return $$(".w", el);
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(" "));
            else {
              const w = document.createElement("span");
              w.className = "w";
              w.textContent = part;
              frag.appendChild(w);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains("w")) walk(child);
      });
    };
    walk(el);
    el.dataset.split = "1";
    return $$(".w", el);
  }

  /**
   * Révélation mot à mot (montée + fondu), puis sortie optionnelle.
   * opts : { at, stagger, dur, out, outDur, rise }
   */
  function words(el, t, opts) {
    const { at, stagger = 0.06, dur = 0.5, out = Infinity, outDur = 0.3, rise = 70 } = opts;
    const ws = splitWords(el);
    ws.forEach((w, i) => {
      const k = p(t, at + i * stagger, at + i * stagger + dur, ease.outQuint);
      const o = 1 - p(t, out, out + outDur, ease.inCubic);
      style(w, { transform: `translateY(${(1 - k) * rise + (1 - o) * -40}px)`, opacity: String(k * o) });
    });
    el.style.visibility = t >= at - 0.01 && t <= out + outDur ? "visible" : "hidden";
  }

  /** Compteur animé (ex : score 0 → 87). */
  function count(el, t, a, b, to, from = 0) {
    el.textContent = String(Math.round(lerp(from, to, p(t, a, b, ease.outExpo))));
  }

  /** Grain filmique : une texture de bruit générée une fois, déplacée à chaque image. */
  function makeGrain() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const img = g.createImageData(256, 256);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(rnd() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const grain = document.createElement("div");
    grain.id = "grain";
    grain.style.backgroundImage = `url(${c.toDataURL()})`;
    $("#stage").appendChild(grain);
    return grain;
  }

  /**
   * Carte de fin commune aux cinq vidéos : marque, promesse honnête, appel à l'action.
   * Retourne une fonction render(t) à appeler par la scène.
   */
  function endCard({ at, title, cta = "Lien en bio", sub = "Gratuit · Sources officielles · France et Belgique" }) {
    const el = document.createElement("div");
    el.className = "layer center";
    el.id = "endcard";
    el.innerHTML = `
      <div class="ec-mark mark" style="margin-bottom:56px"></div>
      <div class="ec-word wordmark" style="margin-bottom:64px">AcadMatch</div>
      <div class="ec-title display md" style="max-width:900px;margin-bottom:56px">${title}</div>
      <div class="ec-cta chip green" style="font-size:44px;padding:26px 54px;margin-bottom:40px">${cta}</div>
      <div class="ec-sub small muted" style="max-width:860px">${sub}</div>`;
    $("#stage").appendChild(el);
    const sweepEl = document.createElement("div");
    sweepEl.className = "sweep";
    sweepEl.style.zIndex = 20;
    $("#stage").appendChild(sweepEl);
    el.style.zIndex = 21;
    el.style.background = "var(--ink)";
    return (t) => {
      // Balayage radar plein écran, puis la carte apparaît par-dessus.
      const a = p(t, at - 0.55, at + 0.05, ease.inOutCubic) * 360;
      sweepEl.style.setProperty("--a", `${a}deg`);
      sweepEl.style.opacity = String(1 - p(t, at + 0.05, at + 0.35));
      const show = p(t, at, at + 0.4);
      el.style.opacity = String(show);
      const pop = (sel, d) => {
        const k = p(t, at + d, at + d + 0.55, ease.outBack);
        style($(sel, el), { transform: `translateY(${(1 - k) * 60}px) scale(${0.9 + 0.1 * k})`, opacity: String(clamp(k * 1.2)) });
      };
      pop(".ec-mark", 0.05);
      pop(".ec-word", 0.15);
      pop(".ec-title", 0.3);
      pop(".ec-cta", 0.5);
      pop(".ec-sub", 0.65);
      // Le logo tourne lentement : le « radar » vit jusqu'à la dernière image.
      $(".ec-mark", el).style.background = `conic-gradient(from ${p(t, at, at + 6, ease.linear) * 90}deg, var(--green-bright) 0 87%, #22322b 0)`;
    };
  }

  window.Studio = {
    clamp, lerp, ease, p, win, $, $$, style, words, count, splitWords, endCard,
    scene({ duration, fps = 30, render }) {
      const grain = makeGrain();
      const bar = document.createElement("div");
      bar.id = "progress";
      bar.innerHTML = "<i></i>";
      $("#stage").appendChild(bar);
      const full = (t) => {
        render(t);
        grain.style.transform = `translate(${(Math.floor(t * 24) * 37) % 128}px, ${(Math.floor(t * 24) * 53) % 128}px)`;
        $("#progress i").style.transform = `scaleX(${clamp(t / duration)})`;
      };
      window.SCENE = { duration, fps, render: full };
      full(0);
      if (location.hash === "#preview") {
        const start = performance.now();
        const loop = () => {
          const t = ((performance.now() - start) / 1000) % duration;
          full(t);
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      }
    },
  };
})();
