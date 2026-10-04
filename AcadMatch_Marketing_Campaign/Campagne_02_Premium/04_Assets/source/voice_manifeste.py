"""Voix off du film de marque (vidéo 6) : générée ici avec son minutage mot par mot (exact)."""
import asyncio
import json
from pathlib import Path

import edge_tts

TEXT = ("Choisir ses études à l'étranger ne devrait pas être un pari. "
        "Derrière chaque formation, il y a des prérequis réels. "
        "Derrière chaque étudiant, un parcours unique. "
        "AcadMatch les compare, avec des sources officielles. "
        "Un score qu'on peut expliquer. Des actions concrètes. "
        "Pas une promesse d'admission : de la clarté. "
        "AcadMatch. Choisis avec des preuves.")
here = Path(__file__).resolve().parent.parent / "voix"


async def main():
    words, audio = [], bytearray()
    c = edge_tts.Communicate(TEXT, "fr-FR-VivienneMultilingualNeural", rate="-6%", boundary="WordBoundary")
    async for chunk in c.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
        elif chunk["type"] == "WordBoundary":
            words.append({"t": round(chunk["offset"] / 1e7, 3), "d": round(chunk["duration"] / 1e7, 3), "w": chunk["text"]})
    (here / "voix_manifeste_Vivienne.mp3").write_bytes(bytes(audio))
    (here / "manifeste_mots.json").write_text(json.dumps({"mots": words}, ensure_ascii=False, indent=1), encoding="utf-8")
    for i, w in enumerate(words):
        print(i, w["t"], w["w"])


asyncio.run(main())
