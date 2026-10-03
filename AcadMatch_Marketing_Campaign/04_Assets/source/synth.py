"""
Synthétiseur de la campagne : musique et effets sonores générés de zéro (Python
standard uniquement, aucun échantillon tiers donc aucun problème de droits).

Usage : python synth.py <spec>   (spec = nom d'une entrée de SPECS, ex : v5-conversion)
Écrit ../audio/<spec>.wav (44,1 kHz, stéréo, 16 bits). Le mixage final et la
normalisation de volume (−14 LUFS, standard des réseaux sociaux) sont faits par
ffmpeg dans mux.mjs.

Chaque vidéo a son ambiance (tempo, accords, instruments) mais partage les mêmes
signatures sonores que la campagne : « ping » radar sur le logo et balayage
(whoosh) sur la transition de fin.
"""
import math
import random
import struct
import sys
import wave
from array import array
from pathlib import Path

SR = 44100
random.seed(42)


def note(name: str) -> float:
    """'A4' → 440 Hz ; accepte les dièses ('C#4')."""
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    pitch, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[pitch] + 12 * (octave - 4)) / 12)


class Mix:
    def __init__(self, seconds: float):
        n = int(seconds * SR) + SR
        self.l = array("f", bytes(4 * n))
        self.r = array("f", bytes(4 * n))
        self.n = n

    def add(self, start: float, samples, gain=1.0, pan=0.0):
        i0 = int(start * SR)
        gl = gain * math.cos((pan + 1) * math.pi / 4)
        gr = gain * math.sin((pan + 1) * math.pi / 4)
        l, r, n = self.l, self.r, self.n
        for k, s in enumerate(samples):
            i = i0 + k
            if i >= n:
                break
            if i >= 0:
                l[i] += s * gl
                r[i] += s * gr

    def write(self, path: Path, master=0.9):
        peak = max(1e-9, max(max(abs(x) for x in self.l), max(abs(x) for x in self.r)))
        g = master / peak
        with wave.open(str(path), "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            frames = bytearray()
            for a, b in zip(self.l, self.r):
                # Saturation douce (tanh) : plus de chaleur, aucun écrêtage numérique.
                frames += struct.pack("<hh", int(math.tanh(a * g * 1.1) * 32000), int(math.tanh(b * g * 1.1) * 32000))
            w.writeframes(bytes(frames))


def env(i, n, a, r):
    """Enveloppe attaque/relâchement (échantillons)."""
    if i < a:
        return i / max(1, a)
    if i > n - r:
        return max(0.0, (n - i) / max(1, r))
    return 1.0


# ---------------------------------------------------------------- instruments

def pad(freqs, dur, bright=4, detune=0.004):
    """Nappe chaude : quelques harmoniques désaccordées par note, attaque lente."""
    n = int(dur * SR)
    out = array("f", bytes(4 * n))
    a, r = int(0.9 * SR), int(1.2 * SR)
    for f in freqs:
        for d in (-detune, 0.0, detune):
            ff = f * (1 + d)
            phases = [random.random() * 6.28 for _ in range(bright)]
            for h in range(1, bright + 1):
                w = 2 * math.pi * ff * h / SR
                amp = 0.18 / (h ** 1.4) / len(freqs)
                ph = phases[h - 1]
                for i in range(n):
                    out[i] += amp * math.sin(w * i + ph)
    for i in range(n):
        out[i] *= env(i, n, a, r)
    return out


def pluck(freq, dur=1.6, damp=0.996, bright=0.5):
    """Corde pincée (Karplus-Strong) : piano/kalimba doux selon l'amortissement."""
    period = max(2, int(SR / freq))
    buf = [random.uniform(-1, 1) * bright + (random.uniform(-1, 1) * (1 - bright)) * 0.3 for _ in range(period)]
    n = int(dur * SR)
    out = array("f", bytes(4 * n))
    idx = 0
    for i in range(n):
        cur = buf[idx]
        nxt = buf[(idx + 1) % period]
        buf[idx] = damp * 0.5 * (cur + nxt)
        out[i] = cur * 0.5
        idx = (idx + 1) % period
    for i in range(min(n, 300)):
        out[i] *= i / 300
    return out


def kick(punch=1.0):
    n = int(0.45 * SR)
    out = array("f", bytes(4 * n))
    ph = 0.0
    for i in range(n):
        t = i / SR
        f = 45 + 95 * math.exp(-t * 28)
        ph += 2 * math.pi * f / SR
        out[i] = math.sin(ph) * math.exp(-t * 7) * punch
    return out


def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    out = array("f", bytes(4 * n))
    prev = 0.0
    decay = 18 if open_ else 70
    for i in range(n):
        x = random.uniform(-1, 1)
        hp = x - prev  # passe-haut grossier : brillance sans grave
        prev = x
        out[i] = hp * 0.25 * math.exp(-i / SR * decay)
    return out


def clap():
    n = int(0.25 * SR)
    out = array("f", bytes(4 * n))
    lp = 0.0
    for i in range(n):
        t = i / SR
        x = random.uniform(-1, 1)
        lp += 0.35 * (x - lp)
        bursts = sum(math.exp(-max(0, t - o) * 60) for o in (0, 0.011, 0.022) if t >= o)
        out[i] = (x - lp) * 0.5 * (bursts * 0.4 + math.exp(-t * 14) * 0.6)
    return out


def sub_bass(freq, dur):
    n = int(dur * SR)
    out = array("f", bytes(4 * n))
    w = 2 * math.pi * freq / SR
    for i in range(n):
        out[i] = (math.sin(w * i) + 0.25 * math.sin(2 * w * i)) * 0.5 * env(i, n, 400, int(0.08 * SR))
    return out


def whoosh(dur=0.8, rise=True):
    """Souffle filtré dont la brillance monte (ou descend) : transitions."""
    n = int(dur * SR)
    out = array("f", bytes(4 * n))
    lp = 0.0
    for i in range(n):
        k = i / n
        shape = math.sin(math.pi * (k if rise else 1 - k) ** 1.6) if rise else math.sin(math.pi * k) * (1 - k)
        cut = 0.02 + 0.5 * (k if rise else 1 - k)
        lp += cut * (random.uniform(-1, 1) - lp)
        out[i] = lp * shape * 0.9
    return out


def riser(dur=1.5, f0=200, f1=1200):
    n = int(dur * SR)
    out = array("f", bytes(4 * n))
    ph = 0.0
    lp = 0.0
    for i in range(n):
        k = i / n
        f = f0 * (f1 / f0) ** k
        ph += 2 * math.pi * f / SR
        lp += (0.05 + 0.4 * k) * (random.uniform(-1, 1) - lp)
        out[i] = (math.sin(ph) * 0.25 + lp * 0.6) * k ** 2
    return out


def impact():
    n = int(1.4 * SR)
    out = array("f", bytes(4 * n))
    ph = 0.0
    lp = 0.0
    for i in range(n):
        t = i / SR
        f = 38 + 70 * math.exp(-t * 9)
        ph += 2 * math.pi * f / SR
        lp += 0.08 * (random.uniform(-1, 1) - lp)
        out[i] = math.sin(ph) * math.exp(-t * 3.2) + lp * math.exp(-t * 6) * 0.8
    return out


def tick(freq=2200, dur=0.05):
    """Petit clic d'interface (apparition d'un élément)."""
    n = int(dur * SR)
    out = array("f", bytes(4 * n))
    for i in range(n):
        out[i] = math.sin(2 * math.pi * freq * i / SR) * math.exp(-i / SR * 90) * 0.5
    return out


def ping(freq=1318.5):
    """Signature « radar » : note claire avec écho, sur l'apparition du logo."""
    n = int(1.8 * SR)
    out = array("f", bytes(4 * n))
    for i in range(n):
        t = i / SR
        s = math.sin(2 * math.pi * freq * t) * math.exp(-t * 3.5) + 0.4 * math.sin(2 * math.pi * freq * 2 * t) * math.exp(-t * 6)
        out[i] = s * 0.45
    for delay, g in ((0.18, 0.35), (0.36, 0.18)):
        d = int(delay * SR)
        for i in range(n - 1, d, -1):
            out[i] += out[i - d] * g
    return out


def typing(dur=1.0, rate=14):
    """Frappe de clavier légère (saisie des matières)."""
    n = int(dur * SR)
    out = array("f", bytes(4 * n))
    t = 0.0
    while t < dur - 0.03:
        i0 = int(t * SR)
        f = random.uniform(2600, 4200)
        for i in range(int(0.018 * SR)):
            if i0 + i < n:
                out[i0 + i] += random.uniform(-1, 1) * math.exp(-i / SR * 260) * 0.35 + math.sin(2 * math.pi * f * i / SR) * math.exp(-i / SR * 400) * 0.1
        t += 1 / rate * random.uniform(0.6, 1.4)
    return out


def glitch(dur=0.35):
    n = int(dur * SR)
    out = array("f", bytes(4 * n))
    hold = 0.0
    for i in range(n):
        if i % random.choice((80, 160, 320)) == 0:
            hold = random.uniform(-1, 1)
        out[i] = hold * 0.4 * (1 - i / n)
    return out


# ---------------------------------------------------------------- arrangements

def beat(mix, start, end, bpm, kick_every=1, hats=True, claps=True, gain=1.0):
    spb = 60 / bpm
    t = start
    k = 0
    while t < end - 0.01:
        if k % kick_every == 0:
            mix.add(t, kick(), 0.9 * gain)
        if claps and k % 4 == 2:
            mix.add(t, clap(), 0.5 * gain, pan=0.05)
        if hats:
            mix.add(t + spb / 2, hat(), 0.5 * gain, pan=0.25)
        t += spb
        k += 1


def chords(mix, start, end, bpm, prog, bars_per_chord=1, gain=0.8, bright=4):
    spb = 60 / bpm
    bar = 4 * spb
    t = start
    i = 0
    while t < end - 0.05:
        dur = min(bar * bars_per_chord, end - t) + 0.8
        mix.add(t, pad([note(n) for n in prog[i % len(prog)]], dur, bright=bright), gain)
        t += bar * bars_per_chord
        i += 1


def arp(mix, start, end, bpm, prog, bars_per_chord=1, step=0.5, gain=0.35, damp=0.995):
    spb = 60 / bpm
    bar = 4 * spb
    t = start
    k = 0
    while t < end - 0.05:
        chord = prog[int((t - start) / (bar * bars_per_chord)) % len(prog)]
        tones = [note(n) * 2 for n in chord]
        f = tones[k % len(tones)]
        mix.add(t, pluck(f, 1.2, damp), gain, pan=-0.3 if k % 2 else 0.3)
        t += spb * step
        k += 1


def bass_line(mix, start, end, bpm, roots, bars_per_root=1, gain=0.55):
    spb = 60 / bpm
    bar = 4 * spb
    t = start
    i = 0
    while t < end - 0.05:
        dur = min(bar * bars_per_root, end - t)
        mix.add(t, sub_bass(note(roots[i % len(roots)]), dur), gain)
        t += bar * bars_per_root
        i += 1


def signature_end(mix, at):
    """Signature commune : balayage puis « ping » radar sur l'apparition du logo."""
    mix.add(at - 0.6, whoosh(0.7, rise=True), 0.7)
    mix.add(at + 0.05, ping(), 0.55)
    mix.add(at + 0.05, impact(), 0.35)


def spec_v5(mix):
    """V5 conversion (13,5 s) : énergique, 118 bpm, mineur lumineux."""
    bpm = 118
    prog = [["A3", "C4", "E4"], ["F3", "A3", "C4"], ["C4", "E4", "G4"], ["G3", "B3", "D4"]]
    chords(mix, 0.0, 9.6, bpm, prog, gain=1.1)
    arp(mix, 0.2, 9.4, bpm, prog, step=0.5, gain=0.45)
    beat(mix, 2.55, 9.4, bpm, gain=0.75)
    bass_line(mix, 2.55, 9.4, bpm, ["A1", "F1", "C2", "G1"])
    mix.add(1.4, riser(1.2), 0.5)
    mix.add(2.55, impact(), 0.5)
    mix.add(3.9, tick(1760), 0.6)
    for i in range(4):
        mix.add(6.9 + i * 0.32, tick(1975 + i * 220), 0.5)
    signature_end(mix, 9.6)
    chords(mix, 9.7, 13.5, bpm, [["A3", "C4", "E4", "B4"]], bars_per_chord=2, gain=1.2, bright=3)
    arp(mix, 9.9, 13.0, 118, [["A3", "C4", "E4", "B4"]], step=1, gain=0.3, damp=0.998)


def drone(freq, dur, wobble=2.0):
    """Nappe grave pulsée : tension (scène du problème)."""
    n = int(dur * SR)
    out = array("f", bytes(4 * n))
    for i in range(n):
        t = i / SR
        lfo = 0.6 + 0.4 * math.sin(2 * math.pi * wobble * t)
        out[i] = (math.sin(2 * math.pi * freq * t) + 0.5 * math.sin(2 * math.pi * freq * 1.5 * t) + 0.3 * math.sin(2 * math.pi * freq * 2.01 * t)) * 0.3 * lfo * env(i, n, int(0.3 * SR), int(0.4 * SR))
    return out


def spec_v1(mix):
    """V1 Trop d'onglets (20,5 s) : tension → balayage → résolution majeure."""
    # Tension : drone qui accélère, un clic par recherche affichée.
    mix.add(0.0, drone(55, 4.0, wobble=3.0), 0.9)
    mix.add(1.2, drone(82.4, 2.8, wobble=6.0), 0.5)
    for i in range(12):
        at = 0.15 + 3.1 * (i / 12) ** 1.35
        mix.add(at, tick(1500 + i * 90, 0.06), 0.55, pan=(i % 3 - 1) * 0.4)
    mix.add(2.65, glitch(0.4), 0.6)
    mix.add(2.4, riser(1.3, 150, 1500), 0.55)
    # Balayage radar : le bruit disparaît.
    mix.add(3.55, whoosh(0.75), 0.9)
    mix.add(4.25, impact(), 0.7)
    # Résolution : majeur, chaleureux, pulsation légère.
    bpm = 100
    prog = [["C4", "E4", "G4", "B4"], ["A3", "C4", "E4", "G4"], ["F3", "A3", "C4", "E4"], ["G3", "B3", "D4", "F4"]]
    chords(mix, 4.3, 16.6, bpm, prog, gain=1.1)
    arp(mix, 6.6, 16.4, bpm, prog, step=0.5, gain=0.4)
    beat(mix, 6.6, 16.4, bpm, claps=False, gain=0.55)
    bass_line(mix, 6.6, 16.4, bpm, ["C2", "A1", "F1", "G1"], gain=0.45)
    for at in (7.3, 9.6, 12.6, 14.6):
        mix.add(at, tick(1975, 0.05), 0.5)
    mix.add(12.4, whoosh(0.5, rise=False), 0.4)
    signature_end(mix, 16.6)
    chords(mix, 16.7, 20.5, bpm, [["C4", "E4", "G4", "D5"]], bars_per_chord=2, gain=1.2, bright=3)
    arp(mix, 16.9, 20.0, bpm, [["C4", "E4", "G4", "D5"]], step=1, gain=0.3, damp=0.998)


def spec_v2(mix):
    """V2 démo (26 s) : clair et entraînant, 108 bpm, majeur, pincés type marimba."""
    bpm = 108
    prog = [["D4", "F#4", "A4"], ["B3", "D4", "F#4"], ["G3", "B3", "D4"], ["A3", "C#4", "E4"]]
    chords(mix, 0.0, 21.9, bpm, prog, gain=0.9, bright=3)
    arp(mix, 0.0, 21.7, bpm, prog, step=0.5, gain=0.5, damp=0.993)
    beat(mix, 2.5, 21.7, bpm, gain=0.6)
    bass_line(mix, 2.5, 21.7, bpm, ["D2", "B1", "G1", "A1"], gain=0.45)
    for at in (2.5, 8.6, 15.4):
        mix.add(at - 0.35, whoosh(0.5), 0.6)
    mix.add(4.6, ping(1760), 0.35)
    mix.add(5.0, tick(1975), 0.5)
    for i in range(4):
        mix.add(9.4 + i * 0.7, typing(0.45, 16), 0.45, pan=-0.2)
        mix.add(9.9 + i * 0.7, tick(2350, 0.04), 0.5)
    mix.add(12.9, tick(1760), 0.55)
    for at in (15.6, 17.75, 19.85):
        mix.add(at, tick(2093, 0.05), 0.55)
    signature_end(mix, 21.9)
    chords(mix, 22.0, 26.0, bpm, [["D4", "F#4", "A4", "E5"]], bars_per_chord=2, gain=1.1, bright=3)
    arp(mix, 22.2, 25.5, bpm, [["D4", "F#4", "A4", "E5"]], step=1, gain=0.3, damp=0.998)


def piano(mix, at, names, gain=0.5, spread=0.0, dur=3.0):
    """Accord de piano doux (cordes pincées très peu amorties), égrené."""
    for i, nm in enumerate(names):
        mix.add(at + i * spread, pluck(note(nm), dur, 0.9985, bright=0.35), gain, pan=(i - len(names) / 2) * 0.15)


def rewind(dur=0.6):
    """Retour en arrière : glissement descendant + souffle."""
    n = int(dur * SR)
    out = array("f", bytes(4 * n))
    ph = 0.0
    lp = 0.0
    for i in range(n):
        k = i / n
        f = 900 * (1 - k) ** 2 + 60
        ph += 2 * math.pi * f / SR
        lp += 0.2 * (random.uniform(-1, 1) - lp)
        out[i] = (math.sin(ph) * 0.4 + lp * 0.5) * math.sin(math.pi * k)
    return out


def spec_v3(mix):
    """V3 15 décembre (26,5 s) : intime et nocturne, puis tension, puis apaisement."""
    # A. Nuit à Cotonou : piano feutré, nappe mineure.
    mix.add(0.0, pad([note("A2"), note("E3"), note("C4")], 3.9, bright=3), 0.9)
    piano(mix, 0.3, ["A3", "C4", "E4"], 0.45, spread=0.12)
    piano(mix, 1.9, ["F3", "A3", "C4"], 0.4, spread=0.12)
    # B. Les mois défilent : horloge qui accélère, feuilles qui tournent.
    mix.add(3.6, pad([note("F2"), note("C3"), note("A3")], 4.8, bright=3), 0.8)
    t = 3.9
    step = 0.5
    while t < 7.0:
        mix.add(t, tick(1200, 0.03), 0.45, pan=-0.3)
        mix.add(t + step / 2, tick(900, 0.03), 0.35, pan=0.3)
        t += step
        step = max(0.22, step * 0.93)
    for k in range(5):
        mix.add(3.9 + 3.1 * ((k + 0.5) / 5), whoosh(0.28, rise=False), 0.4)
    piano(mix, 7.1, ["G3", "C4", "E4"], 0.45, spread=0.08)
    # C. Le retour à décembre : rewind, impact, battement inquiet.
    mix.add(8.35, rewind(0.7), 0.8)
    mix.add(9.05, impact(), 0.75)
    mix.add(9.05, drone(55, 4.0, wobble=1.6), 0.7)
    for k in range(6):
        mix.add(9.3 + k * 0.62, kick(0.6), 0.5)
    # D. AcadMatch : le bon calendrier, apaisement majeur.
    bpm = 92
    prog = [["C4", "E4", "G4"], ["G3", "B3", "D4"], ["A3", "C4", "E4"], ["F3", "A3", "C4"]]
    chords(mix, 12.9, 22.2, bpm, prog, gain=1.0, bright=3)
    arp(mix, 13.2, 22.0, bpm, prog, step=0.5, gain=0.35, damp=0.997)
    mix.add(14.6, ping(1568), 0.35)
    mix.add(17.6, tick(2093), 0.55)
    piano(mix, 20.5, ["C4", "E4", "G4", "C5"], 0.45, spread=0.06)
    signature_end(mix, 22.2)
    chords(mix, 22.3, 26.5, bpm, [["C4", "E4", "G4", "D5"]], bars_per_chord=2, gain=1.1, bright=3)
    piano(mix, 22.4, ["C4", "G4", "D5"], 0.35, spread=0.15, dur=3.5)


def shimmer(dur=1.6):
    """Scintillement : notes aiguës rapides et aléatoires (les matières qui s'envolent)."""
    n = int(dur * SR)
    out = array("f", bytes(4 * n))
    t = 0.0
    scale = [note(x) * 2 for x in ("E5", "G5", "A5", "B5", "D6", "E6")]
    while t < dur - 0.2:
        f = random.choice(scale)
        i0 = int(t * SR)
        for i in range(int(0.25 * SR)):
            if i0 + i < n:
                out[i0 + i] += math.sin(2 * math.pi * f * i / SR) * math.exp(-i / SR * 14) * 0.12
        t += random.uniform(0.04, 0.09)
    return out


def spec_v4(mix):
    """V4 Lu comme un jury (19,8 s) : sombre, demi-tempo, scan, envol, impact, silence sur le message."""
    bpm = 90
    mix.add(0.0, drone(41.2, 2.6, wobble=0.8), 0.9)
    mix.add(0.15, impact(), 0.6)
    prog = [["E3", "G3", "B3"], ["C3", "E3", "G3"], ["A2", "C3", "E3"], ["B2", "D#3", "F#3"]]
    chords(mix, 2.2, 16.2, bpm, prog, gain=0.85, bright=3)
    # Demi-tempo : grosse caisse sur 1, claquement sur 3.
    spb = 60 / bpm
    t = 2.3
    k = 0
    while t < 14.3:
        if k % 4 == 0:
            mix.add(t, kick(), 0.9)
        if k % 4 == 2:
            mix.add(t, clap(), 0.55)
        mix.add(t + spb / 2, hat(), 0.4, pan=0.3)
        t += spb
        k += 1
    bass_line(mix, 2.3, 14.3, bpm, ["E1", "C1", "A0", "B0"], gain=0.6)
    for i in range(5):
        mix.add(3.5 + i * 0.42, tick(1318.5 + i * 110, 0.08), 0.55, pan=-0.2 + i * 0.1)
    mix.add(3.3, whoosh(2.4, rise=False), 0.25)
    mix.add(6.3, shimmer(1.8), 0.8)
    mix.add(6.6, riser(1.6, 220, 1760), 0.5)
    mix.add(8.2, impact(), 0.85)
    mix.add(8.2, ping(1318.5), 0.3)
    for i in range(3):
        mix.add(11.6 + i * 0.35, tick(1760 - i * 220, 0.05), 0.5)
    # Le message honnête : la rythmique s'arrête, une seule note tenue.
    mix.add(14.3, whoosh(0.4, rise=False), 0.5)
    mix.add(14.6, pluck(note("B4"), 2.0, 0.9985, bright=0.35), 0.5)
    signature_end(mix, 16.2)
    chords(mix, 16.3, 19.8, bpm, [["E3", "B3", "D4", "G4"]], bars_per_chord=2, gain=1.1, bright=3)
    arp(mix, 16.5, 19.4, bpm, [["E3", "B3", "D4", "G4"]], step=1, gain=0.3, damp=0.998)


SPECS = {"v5-conversion": (13.5, spec_v5), "v1-onglets": (20.5, spec_v1), "v2-demo": (26.0, spec_v2), "v3-15-decembre": (26.5, spec_v3), "v4-jury": (19.8, spec_v4)}


if __name__ == "__main__":
    name = sys.argv[1]
    seconds, build = SPECS[name]
    mix = Mix(seconds)
    build(mix)
    out = Path(__file__).resolve().parent.parent / "audio" / f"{name}.wav"
    mix.write(out)
    print("OK", out)
