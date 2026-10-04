"""
Minutage mot par mot de la voix imposée (vidéo 1).

Le fichier fourni (voix_VivienneMultilingualNeural.mp3) a été généré par
edge-tts. On relance exactement la même synthèse (même texte, même voix, même
débit) en demandant les « WordBoundary » : on obtient l'instant de chaque mot,
puis on vérifie que l'audio regénéré est identique octet pour octet au
fichier imposé — sinon les temps ne seraient pas fiables.
"""
import asyncio
import hashlib
import json
import sys
from pathlib import Path

import edge_tts

TEXT = ("Aïcha vit à Cotonou. Elle rêve d'un master en France… et elle pense avoir jusqu'en mars. "
        "Mais depuis le Bénin, sa date limite Campus France, c'est le quinze décembre. "
        "AcadMatch lui affiche le bon calendrier. Avant qu'il ne soit trop tard.")
VOICE = "fr-FR-VivienneMultilingualNeural"
here = Path(__file__).resolve().parent
imposed = here.parent / "voix" / "voix_VivienneMultilingualNeural.mp3"


async def main():
    words, audio = [], bytearray()
    c = edge_tts.Communicate(TEXT, VOICE, rate="-4%", boundary="WordBoundary")
    async for chunk in c.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
        elif chunk["type"] == "WordBoundary":
            words.append({"t": round(chunk["offset"] / 1e7, 3), "d": round(chunk["duration"] / 1e7, 3), "w": chunk["text"]})
    same = hashlib.sha256(bytes(audio)).hexdigest() == hashlib.sha256(imposed.read_bytes()).hexdigest()
    out = here.parent / "voix" / "vivienne_mots.json"
    out.write_text(json.dumps({"identique_au_fichier_impose": same, "mots": words}, ensure_ascii=False, indent=1), encoding="utf-8")
    print("identique:", same, "| mots:", len(words))
    for w in words:
        print(f'{w["t"]:6.2f}  {w["d"]:.2f}  {w["w"]}')


asyncio.run(main())
