import re
import ssl
import urllib.request
from pathlib import Path

"""
Audit HTTP des sources officielles du catalogue.

Note : certains établissements ont une chaîne SSL capricieuse depuis certains
environnements Python — un échec SSL ici n'est pas forcément un lien mort
(revérifier dans un navigateur). Un 404, lui, est bloquant.
"""

ctx = ssl.create_default_context()

text = Path("data/formations.ts").read_text(encoding="utf-8")
urls = re.findall(r'source: "(https://[^"]+)"', text)
print("count", len(urls))
for u in urls:
    ok = False
    last = ""
    for method in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(
                u, method=method, headers={"User-Agent": "AcadMatchAudit/1.0"}
            )
            with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
                print(r.status, method, u)
                ok = True
                break
        except Exception as e:
            last = f"{type(e).__name__}: {e}"
    if not ok:
        print("FAIL", last, u)
