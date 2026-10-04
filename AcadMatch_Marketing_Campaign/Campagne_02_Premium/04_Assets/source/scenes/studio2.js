/*
 * Moteur d'animation v2 (campagne 02). Comme la v1, tout dépend du temps t :
 * render(t) est pur, l'export est déterministe. Nouveautés :
 *  - Clip : lecture image par image des « tournages » de la vraie interface ;
 *  - cam() : caméra à images clés (zooms intelligents sur l'interface) ;
 *  - tap() : retour visuel au moment exact d'un vrai clic ;
 *  - captions() : sous-titres synchronisés mot par mot sur la voix ;
 *  - fond vivant, téléphone réaliste, transitions « whip » et « radar ».
 * Les images des clips se chargent à la demande : SCENE.ready() attend leur
 * décodage avant chaque capture (render2.mjs).
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
    inOutExpo: (x) => (x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
    outBack: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    outQuint: (x) => 1 - Math.pow(1 - x, 5),
  };
  const p = (t, a, b, curve = ease.outCubic) => curve(clamp((t - a) / (b - a)));
  const win = (t, a, b, fi = 0.35, fo = 0.3) => Math.min(p(t, a, a + fi), 1 - p(t, b - fo, b, ease.inCubic));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const style = (el, s) => { if (el) for (const k in s) el.style[k] = s[k]; };
  const pending = [];

  function splitWords(el) {
    if (el.dataset.split) return $$(".w", el);
    const walk = (node) => [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) f.appendChild(document.createTextNode(" "));
          else { const w = document.createElement("span"); w.className = "w"; w.textContent = part; f.appendChild(w); }
        });
        node.replaceChild(f, c);
      } else if (c.nodeType === 1 && !c.classList.contains("w")) walk(c);
    });
    walk(el);
    el.dataset.split = "1";
    return $$(".w", el);
  }

  /** Révélation mot à mot avec flou de mouvement (montée + netteté), sortie optionnelle. */
  function words(el, t, { at, stagger = 0.06, dur = 0.5, out = Infinity, outDur = 0.3, rise = 80, blur = 14 }) {
    splitWords(el).forEach((w, i) => {
      const k = p(t, at + i * stagger, at + i * stagger + dur, ease.outQuint);
      const o = 1 - p(t, out, out + outDur, ease.inCubic);
      style(w, { transform: `translateY(${(1 - k) * rise - (1 - o) * 50}px)`, opacity: String(k * o), filter: `blur(${(1 - k) * blur + (1 - o) * 8}px)` });
    });
    el.style.visibility = t >= at - 0.01 && t <= out + outDur ? "visible" : "hidden";
  }

  function count(el, t, a, b, to, from = 0) { el.textContent = String(Math.round(lerp(from, to, p(t, a, b, ease.outExpo)))); }

  /** Lecteur de clip (dossier de JPEG tournés sur la vraie interface). */
  class Clip {
    constructor(img, name) {
      this.img = img; this.name = name; this.meta = (window.CLIPS || {})[name]; this.cur = -1;
      if (!this.meta) throw new Error(`Clip inconnu : ${name}`);
    }
    get frames() { return this.meta.frames; }
    mark(label) { return this.meta.marks[label]; }
    tapInfo(label) { return this.meta.taps.find((x) => x.label === label); }
    show(frame) {
      const f = Math.max(1, Math.min(this.frames, Math.round(frame)));
      if (f === this.cur) return;
      this.cur = f;
      this.img.src = `../../ui_clips/${this.name}/${String(f).padStart(4, "0")}.jpg`;
      pending.push(this.img.decode().catch(() => {}));
    }
    /** Joue les images [from, to] entre les instants a et b (secondes). */
    play(t, a, b, from = 1, to = this.frames, curve = ease.linear) {
      this.show(lerp(from, to, curve(clamp((t - a) / (b - a)))));
    }
  }

  /** Téléphone réaliste contenant un clip ; renvoie { el, screen, clip }. */
  function phone(parent, clipName, { x = 160, y = 200 } = {}) {
    const el = document.createElement("div");
    el.className = "phone";
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.innerHTML = `<div class="screen"><img class="clip"><div class="island"></div><div class="glass"></div></div>`;
    parent.appendChild(el);
    const screen = $(".screen", el);
    return { el, screen, clip: new Clip($("img", el), clipName), glass: $(".glass", el) };
  }

  /** Retour visuel d'un clic réel : cercle qui se pose puis s'élargit. Coordonnées en px CSS de l'écran 390 px. */
  function tap(screen, t, at, x, y) {
    let el = screen.querySelector(`.tap[data-at="${at}"]`);
    if (!el) { el = document.createElement("div"); el.className = "tap"; el.dataset.at = String(at); screen.appendChild(el); }
    const s = 720 / 390;
    const k = p(t, at - 0.25, at, ease.outBack), r = p(t, at, at + 0.5, ease.outCubic);
    style(el, { left: `${x * s}px`, top: `${y * s + 104}px`, opacity: String(k * (1 - r)), transform: `scale(${0.6 + 0.4 * k + r * 0.8})` });
  }

  /** Caméra : images clés {t, x, y, s} = point de la scène amené au centre, à l'échelle s. */
  function cam(el, t, keys, curve = ease.inOutCubic) {
    let a = keys[0], b = keys[keys.length - 1];
    for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i].t && t <= keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; break; }
    const k = b.t === a.t ? 1 : curve(clamp((t - a.t) / (b.t - a.t)));
    const x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k), s = lerp(a.s, b.s, k), r = lerp(a.r || 0, b.r || 0, k);
    el.style.transformOrigin = "0 0";
    el.style.transform = `translate(${540 - x * s}px, ${960 - y * s}px) scale(${s}) rotate(${r}deg)`;
  }

  /** Sous-titres synchronisés : groupes de mots ; le mot prononcé s'allume. */
  function captions(el, t, words, groups) {
    if (!el.dataset.built) {
      el.innerHTML = groups.map((g, gi) => `<div class="cg" data-g="${gi}">${g.map((i) => `<span class="cw" data-i="${i}">${words[i].w}</span>`).join(" ")}</div>`).join("");
      el.dataset.built = "1";
    }
    groups.forEach((g, gi) => {
      const start = words[g[0]].t - 0.12, last = words[g[g.length - 1]];
      const next = groups[gi + 1] ? words[groups[gi + 1][0]].t - 0.12 : last.t + last.d + 0.6;
      const box = el.querySelector(`[data-g="${gi}"]`);
      const vis = t >= start && t < next;
      box.style.display = vis ? "block" : "none";
      if (!vis) return;
      const k = p(t, start, start + 0.18);
      box.style.transform = `translateY(${(1 - k) * 24}px) scale(${0.96 + 0.04 * k})`;
      box.style.opacity = String(k);
      g.forEach((i) => {
        const w = words[i];
        const span = box.querySelector(`[data-i="${i}"]`);
        const spoken = t >= w.t - 0.03;
        span.style.color = spoken ? "#fff" : "rgba(255,255,255,0.42)";
        const active = t >= w.t - 0.03 && t < w.t + w.d + 0.08;
        span.style.background = active ? "var(--green)" : "transparent";
      });
    });
  }

  /** Fond vivant : dégradé maillé qui respire + grille en perspective qui avance. */
  function livingBg(parent, { colors = ["#0a7d55", "#064631", "#133a2b", "#0b1f18"], grid = true } = {}) {
    const wrap = document.createElement("div");
    wrap.className = "layer";
    wrap.innerHTML = `<div class="mesh">${colors.map(() => "<i></i>").join("")}</div>${grid ? '<div class="grid3d"></div>' : ""}`;
    parent.prepend(wrap);
    const blobs = $$(".mesh i", wrap);
    const seeds = blobs.map((_, i) => ({ x: 20 + (i * 37) % 60, y: 15 + (i * 53) % 70, r: 700 + (i * 131) % 400, ph: i * 1.7 }));
    blobs.forEach((b, i) => { b.style.background = colors[i]; b.style.width = b.style.height = `${seeds[i].r}px`; });
    const g = $(".grid3d", wrap);
    return (t) => {
      blobs.forEach((b, i) => {
        const s = seeds[i];
        b.style.left = `calc(${s.x + Math.sin(t * 0.35 + s.ph) * 9}% - ${s.r / 2}px)`;
        b.style.top = `calc(${s.y + Math.cos(t * 0.3 + s.ph) * 7}% - ${s.r / 2}px)`;
      });
      if (g) g.style.backgroundPosition = `0 ${(t * 60) % 120}px`;
    };
  }

  /** Balayage radar plein écran (signature de la marque). */
  function sweep(parent, z = 60) {
    const el = document.createElement("div");
    el.className = "sweep";
    el.style.zIndex = String(z);
    parent.appendChild(el);
    return (t, a, b) => {
      const k = p(t, a, b, ease.inOutCubic);
      el.style.setProperty("--a", `${k * 360}deg`);
      el.style.opacity = String(t < a ? 0 : 1 - p(t, b, b + 0.3));
    };
  }

  /** Carte de fin premium : logo radar qui se remplit, nom, promesse, appel à l'action lumineux. */
  function endCard(parent, { at, title, cta = "Lien en bio", sub = "Gratuit · Sources officielles · France et Belgique", titleTimes = null }) {
    const el = document.createElement("div");
    el.className = "layer center";
    el.style.zIndex = "70";
    el.innerHTML = `
      <div class="ec-bg layer" style="background:radial-gradient(90% 60% at 50% 42%, #0f3a2a 0%, #050b08 70%)"></div>
      <div class="ec-mark mark" style="position:relative;margin-bottom:54px"></div>
      <div class="ec-word wordmark" style="position:relative;margin-bottom:60px">AcadMatch</div>
      <div class="ec-title display md" style="position:relative;max-width:920px;margin-bottom:58px">${title}</div>
      <div class="ec-cta chip green" style="position:relative;font-size:44px;padding:28px 58px;margin-bottom:40px">${cta}</div>
      <div class="ec-sub small mute" style="position:relative;max-width:880px">${sub}</div>`;
    parent.appendChild(el);
    const s = sweep(parent, 69);
    splitWords($(".ec-title", el));
    return (t) => {
      s(t, at - 0.6, at + 0.02);
      el.style.opacity = String(p(t, at, at + 0.25));
      el.style.visibility = t >= at - 0.01 ? "visible" : "hidden";
      const fill = p(t, at + 0.05, at + 0.9, ease.outCubic) * 87;
      $(".ec-mark", el).style.background = `conic-gradient(from ${p(t, at, at + 8, ease.linear) * 120}deg, var(--green-bright) 0 ${fill}%, #22322b 0)`;
      $(".ec-mark", el).style.transform = `scale(${0.7 + 0.3 * p(t, at, at + 0.6, ease.outBack)})`;
      const pop = (sel, d) => { const k = p(t, at + d, at + d + 0.6, ease.outQuint); style($(sel, el), { opacity: String(k), transform: `translateY(${(1 - k) * 50}px)`, filter: `blur(${(1 - k) * 10}px)` }); };
      pop(".ec-word", 0.2);
      // titleTimes : instants imposés (voix off) pour chaque mot du titre.
      if (titleTimes) splitWords($(".ec-title", el)).forEach((w, i) => { const k = p(t, titleTimes[i] - 0.05, titleTimes[i] + 0.35, ease.outQuint); style(w, { opacity: String(k), transform: `translateY(${(1 - k) * 60}px)`, filter: `blur(${(1 - k) * 12}px)` }); });
      else words($(".ec-title", el), t, { at: at + 0.4, stagger: 0.07, dur: 0.5 });
      pop(".ec-cta", 0.8);
      pop(".ec-sub", 1.0);
      const glow = 0.5 + 0.5 * Math.sin((t - at) * 3);
      $(".ec-cta", el).style.boxShadow = `0 0 ${30 + glow * 40}px rgba(63,164,120,${0.35 + glow * 0.3})`;
    };
  }

  function grainAndVignette(stage) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d"), img = g.createImageData(256, 256);
    let seed = 9;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < img.data.length; i += 4) { const v = rnd() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    const grain = document.createElement("div");
    grain.id = "grain";
    grain.style.backgroundImage = `url(${c.toDataURL()})`;
    const vig = document.createElement("div");
    vig.id = "vignette";
    stage.append(vig, grain);
    return (t) => { const f = Math.floor(t * 24); grain.style.transform = `translate(${(f * 37) % 128}px, ${(f * 53) % 128}px)`; };
  }

  /**
   * Révèle les mots d'une phrase aux instants où la voix les prononce. Les signes
   * isolés (« : », « — ») apparaissent avec le mot précédent.
   */
  function vwords(el, t, times, start, { out = Infinity, outDur = 0.3, rise = 70 } = {}) {
    let idx = start - 1;
    splitWords(el).forEach((w) => {
      if (!/^[—–:;!?.,…]+$/.test(w.textContent)) idx += 1;
      const at = times[Math.max(start, idx)].t;
      const k = p(t, at - 0.06, at + 0.32, ease.outQuint), o = 1 - p(t, out, out + outDur, ease.inCubic);
      style(w, { opacity: String(k * o), transform: `translateY(${(1 - k) * rise - (1 - o) * 40}px)`, filter: `blur(${(1 - k) * 12 + (1 - o) * 8}px)` });
    });
    el.style.visibility = t >= times[start].t - 0.1 && t <= out + outDur ? "visible" : "hidden";
  }

  window.Studio = {
    vwords,
    clamp, lerp, ease, p, win, $, $$, style, words, count, splitWords, Clip, phone, tap, cam, captions, livingBg, sweep, endCard,
    scene({ duration, fps = 30, render }) {
      const fx = grainAndVignette($("#stage"));
      const full = (t) => { render(t); fx(t); };
      window.SCENE = {
        duration, fps,
        render: full,
        async ready() { const list = pending.splice(0); await Promise.all(list); },
      };
      full(0);
      if (location.hash === "#preview") {
        const start = performance.now();
        const loop = () => { full(((performance.now() - start) / 1000) % duration); requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
    },
  };
})();
