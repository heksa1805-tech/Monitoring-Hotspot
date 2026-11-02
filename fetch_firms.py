import os, csv, io, json, urllib.request, urllib.error
from datetime import datetime, timezone
from pathlib import Path
from shapely.geometry import shape, Point

ROOT=Path(__file__).resolve().parents[1]
BOUNDARY=ROOT/"data/pt_tmk.geojson"
OUT=ROOT/"data"
KEY=os.environ.get("FIRMS_MAP_KEY")
if not KEY: raise SystemExit("FIRMS_MAP_KEY belum diatur pada GitHub Secrets")
if not BOUNDARY.exists(): raise SystemExit("Tambahkan data/pt_tmk.geojson (polygon batas PBPH TMK)")
boundary_json=json.loads(BOUNDARY.read_text(encoding="utf-8"))
geoms=[]
for f in boundary_json.get("features",[]):
    g=shape(f["geometry"])
    if not g.is_valid: g=g.buffer(0)
    geoms.append(g)
if not geoms: raise SystemExit("GeoJSON tidak memiliki feature polygon")
# Bounding box gabungan batas PBPH; hasil API kemudian dipotong tepat mengikuti poligon.
from shapely.ops import unary_union
pbph=unary_union(geoms)
west,south,east,north=pbph.bounds
bbox=",".join(f"{v:.6f}" for v in (west,south,east,north))
sources=["MODIS_NRT","VIIRS_SNPP_NRT","VIIRS_NOAA20_NRT","VIIRS_NOAA21_NRT"]
all_rows=[]
for source in sources:
    url=f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{KEY}/{source}/{bbox}/5"
    try:
        req=urllib.request.Request(url,headers={"User-Agent":"TMK-Hotspot-Monitor/1.0"})
        with urllib.request.urlopen(req,timeout=90) as response:
            content=response.read().decode("utf-8-sig")
        reader=csv.DictReader(io.StringIO(content))
        for row in reader:
            try:
                lon=float(row["longitude"]); lat=float(row["latitude"])
                if pbph.covers(Point(lon,lat)):
                    row["source_id"]=source
                    all_rows.append(row)
            except (ValueError,KeyError,TypeError): continue
    except urllib.error.HTTPError as e:
        raise SystemExit(f"NASA FIRMS HTTP {e.code} pada sumber {source}") from e
# Deduplikasi konservatif: tanggal, waktu, koordinat, satelit/instrumen.
seen=set(); unique=[]
for r in all_rows:
    k=(r.get("acq_date"),r.get("acq_time"),r.get("latitude"),r.get("longitude"),r.get("satellite"),r.get("instrument"))
    if k not in seen: seen.add(k); unique.append(r)
fields=sorted({k for r in unique for k in r.keys()})
OUT.mkdir(exist_ok=True)
with (OUT/"hotspots_latest.csv").open("w",newline="",encoding="utf-8-sig") as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(unique)
features=[]
for r in unique:
    lon=float(r["longitude"]);lat=float(r["latitude"])
    props={k:v for k,v in r.items() if k not in ("latitude","longitude")}
    features.append({"type":"Feature","geometry":{"type":"Point","coordinates":[lon,lat]},"properties":props})
geo={"type":"FeatureCollection","name":"TMK NASA FIRMS hotspots clipped to PBPH","features":features}
(OUT/"hotspots_latest.geojson").write_text(json.dumps(geo,ensure_ascii=False),encoding="utf-8")
(OUT/"metadata.json").write_text(json.dumps({"updated_at":datetime.now(timezone.utc).isoformat(timespec="seconds"),"count":len(unique),"sources":sources,"boundary":"data/batas_pbph.geojson"},ensure_ascii=False,indent=2),encoding="utf-8")
print(f"Selesai: {len(unique)} hotspot di dalam batas PBPH TMK")
