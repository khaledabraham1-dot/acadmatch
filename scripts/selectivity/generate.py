"""
Régénère les entrées Mon Master et Parcoursup de data/selectivity.ts depuis
l'API officielle data.enseignementsup-recherche.gouv.fr (session indiquée).

Usage : python scripts/selectivity/generate.py > /tmp/sel.ts, puis remplacer
les lignes « mon-master » et « parcoursup » de data/selectivity.ts. Chaque
été : vérifier la nouvelle session, mettre à jour SESSION, relancer, relire
les écarts. Les correspondances fiche → identifiants ont été vérifiées à la
main contre la page officielle de chaque fiche (2026-09-30).
"""
import json, urllib.request, urllib.parse
SESSION = "2025"
API="https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/"
def get(ds, where, select):
  where = where.replace("{SESSION}", SESSION)
  url=API+ds+"/records?"+urllib.parse.urlencode({"where":where,"limit":100,"select":select})
  return json.load(urllib.request.urlopen(url, timeout=60))["results"]
MM = {
 "f-llm-international-economic-law-toulouse": ["1801140QA24D"],
 "f-m1-applied-maths-grenoble": ["1602282LGJWS","1602282LT1W7"],
 "f-m1-maths-fondamentales-paris-saclay": ["1501354GA2P8"],
 "f-master-ase-lille": ["1504658PD4AX"],
 "f-master-bioinformatique-bordeaux": ["1603185TNZ76","1603185TQNBY"],
 "f-master-bmc-sorbonne": ["1900268S1YZT","1900268SWTGX","1900268SRQPA","1900268SG4NT","1900268SCIQA","1900268SD8XV"],
 "f-master-chimie-strasbourg": ["1800640WCWSX"],
 "f-master-droit-affaires-amu": ["1800873Z1QCE"],
 "f-master-droit-europeen-strasbourg": ["1800678NJBN3","1800678NRIDK","1800678NLYT5","1800678N7GYR","1800678NX7CA"],
 "f-master-mecanique-sorbonne": ["1900308KICBS","1900308KD6YA","1900308KYR18","1900308KZ3BK","1900308KJFYC","1900308KN8R5","1900308K5YF1","1900308KE8MI"],
 "f-master-physique-lyon1": ["2200135X6QJM","2200135X3SDH","2200135X8YJI"],
 "f-master-science-politique-paris1": ["1604337QUV61","1604337QT4IF","1604337QE2R5","1604337QG7CW","1604337Q8AT1","1604337Q5MY8","1604337QSRXB","1604337QG64S","1604337QWYTK"],
 "f-mosig-grenoble-inp": ["1602521W4U67","1602521WTX5W"],
 "f-scdi-sorbonne": ["1900282G8KFQ"],
 # Deuxième vague (2026-10-05)
 "f-master-economie-developpement-uca": ["1702186C6ZN4","1702186CFN6R","1702186C871J","1702186CMT16","1702186CGLJN","1702186CUGVW"],
 "f-master-mbfa-risques-financiers-rouen": ["1701081BFJK7"],
 "f-master-mae-double-competence-tours": ["1801077WXH4R"],
 "f-master-sante-publique-bordeaux": ["1602011SNX7E"],
 "f-m1-genie-civil-grenoble": ["1603437S284P"],
 "f-master-securite-informatique-amu": ["1800865R846R"],
 # Troisième vague (2026-10-05) — Paris 8 : la ligne en présentiel (formation initiale), pas celle de l'IED.
 "f-master-droit-public-paris8": ["1501643W54PM"],
 "f-master-droit-developpement-paris-cite": ["1900232C4THI"],
 "f-master-droit-affaires-lorraine": ["1800137ZXEIA"],
 "f-master-plantes-tropicales-montpellier": ["1501396CJQK5"],
}
PS = {
 "f-but-info-nantes": "5482", "f-licence-droit-bordeaux": "26330", "f-licence-eco-gestion-amu": "12528",
 "f-licence-eco-gestion-tse": "4138", "f-licence-info-paris-saclay": "27930", "f-licence-info-sorbonne": "47331",
 "f-licence-info-toulouse": "4188", "f-licence-maths-rennes": "19305", "f-licence-physique-montpellier": "31260",
 "f-licence-science-politique-lille": "20949", "f-licence-sciences-vie-lorraine": "42987", "f-licence-spi-strasbourg": "8059",
 "f-licence-aes-lille": "20946", "f-licence-gestion-iaelyon": "39677",
}
out=[]
for fid, ids in MM.items():
  rows=get("fr-esr-mon_master", 'session="{SESSION}" and ifc in ('+",".join('"%s"'%i for i in ids)+')', "ifc,parcours,col,n_can_pp,n_prop_total,n_can_noninscri_pp,n_prop_noninscri_total")
  assert len(rows)==len(ids), (fid, len(rows))
  s=lambda k: sum(int(r[k] or 0) for r in rows)
  out.append(f'  "{fid}": {{ kind: "mon-master", session: "{SESSION}", recordIds: {json.dumps(sorted(ids))}, capacity: {s("col")}, candidates: {s("n_can_pp")}, offers: {s("n_prop_total")}, fromAbroadCandidates: {s("n_can_noninscri_pp")}, fromAbroadOffers: {s("n_prop_noninscri_total")} }},')
for fid, code in PS.items():
  rows=get("fr-esr-parcoursup", f'session="{SESSION}" and cod_aff_form="{code}"', "cod_aff_form,lib_for_voe_ins,select_form,capa_fin,voe_tot,prop_tot,taux_acces_ens,lien_form_psup")
  assert len(rows)==1, (fid, len(rows)); r=rows[0]
  out.append(f'  "{fid}": {{ kind: "parcoursup", session: "{SESSION}", recordId: "{code}", selective: {str(r["select_form"]=="formation sélective").lower()}, capacity: {int(r["capa_fin"])}, applications: {int(r["voe_tot"])}, accessRate: {int(r["taux_acces_ens"])}, platformUrl: {json.dumps(r["lien_form_psup"])} }},')
print("\n".join(out))
