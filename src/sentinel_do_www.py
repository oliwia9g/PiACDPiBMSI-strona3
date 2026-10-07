from pathlib import Path
import argparse
import json
import math
import re
import shutil
import sys

import numpy as np
import rasterio
from rasterio.features import geometry_mask
from rasterio.warp import reproject, transform_bounds, transform_geom, Resampling
from rasterio.transform import array_bounds, from_bounds
from PIL import Image

# ----------------------------------------------------------------------------
# Konfiguracja
# ----------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent     # katalog projektu (skrypt leży w src/)
SITE = ROOT / "site"                               # strona do publikacji

# Każde miasto ma własne katalogi, więc obliczenia jednego miasta nie nadpisują drugiego.
# Ścieżki ustawia set_city() na podstawie argumentu, np. `python3 src/sentinel_do_www.py gdansk`.
CITY = None
SCENE_DIR = AOI_PATH = RASTER_DIR = TILE_DIR = SUMMARY_PATH = None


def set_city(city):
    global CITY, SCENE_DIR, AOI_PATH, RASTER_DIR, TILE_DIR, SUMMARY_PATH
    CITY = city
    SCENE_DIR = ROOT / "data" / city / "scene"          # kanały TIFF (poza gitem)
    AOI_PATH = SITE / "aoi" / f"{city}.geojson"          # granica miasta, EPSG:4326
    RASTER_DIR = ROOT / "outputs" / city / "rasters"     # GeoTIFF float32 (poza gitem)
    TILE_DIR = SITE / "tiles" / city                     # kafelki strony
    SUMMARY_PATH = SITE / "summary" / f"{city}.json"     # statystyki dla strony

MINZOOM, MAXZOOM = 9, 12
NODATA = -9999.0

# Kanały Sentinel-2 użyte w ćwiczeniu
BANDS = {"B02": "niebieski", "B03": "zielony", "B04": "czerwony",
         "B08": "NIR", "B11": "SWIR1"}

# Wskaźnik = (A - B) / (A + B)
INDEX_BANDS = {
    "NDVI":  ("B08", "B04"),   # roślinność
    "NDBI":  ("B11", "B08"),   # zabudowa / odsłonięta gleba
    "MNDWI": ("B03", "B11"),   # woda (Xu 2006)
    "NDWI":  ("B03", "B08"),   # woda (McFeeters 1996)
    "NDMI":  ("B08", "B11"),   # wilgotność roślinności
}

# Skale barw - te same co w script.js (cfg.ramps), zakres stały od -1 do 1
RAMPS = {
    "NDVI":  ["#a50026", "#de3f2e", "#f88e52", "#fdd481", "#fefebd", "#cbe881", "#84ca66", "#2a9f54", "#006837"],
    "NDBI":  ["#2d004b", "#5f3a91", "#998fbf", "#cfcee5", "#f7f6f5", "#fdd59f", "#ed9b39", "#bc6109", "#7f3b08"],
    "MNDWI": ["#543005", "#995d12", "#cfa255", "#f0dfb2", "#f4f4f4", "#b3e2db", "#58b0a6", "#0c7068", "#003c30"],
    "NDWI":  ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4"],
    "NDMI":  ["#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e"],
}


# ----------------------------------------------------------------------------
# 1. Wczytanie sceny, georeferencja, maska
# ----------------------------------------------------------------------------
def find_band(band):
    files = sorted(SCENE_DIR.glob(f"*_{band}_*.tif*"))
    if len(files) != 1:
        sys.exit(f"Oczekiwano jednego pliku kanału {band} w {SCENE_DIR}, znaleziono {len(files)}.")
    return files[0]


def load_scene():
    """Czyta kanały, sprawdza wspólną siatkę, buduje maskę granicy i jakości."""
    raw, profile, names = {}, None, {}
    for band in BANDS:
        path = find_band(band)
        names[band] = path.name
        with rasterio.open(path) as src:
            if src.dtypes[0] != "float32":
                sys.exit(f"{path.name}: oczekiwano float32 (reflektancja), jest {src.dtypes[0]}. "
                         "Wyeksportuj z Copernicus Browser jako TIFF 32-bit float.")
            if profile is None:
                profile = src.profile.copy()
            elif (src.crs, src.transform, src.width, src.height) != (
                    profile["crs"], profile["transform"], profile["width"], profile["height"]):
                sys.exit(f"{path.name}: inna siatka niż pozostałe kanały (CRS, transformacja lub wymiary).")
            raw[band] = src.read(1)

    # Produkt i data z nazwy pliku, np. 2026-09-30-00_00_..._Sentinel-2_L1C_B04_Raw.tiff
    m = re.match(r"(\d{4}-\d{2}-\d{2}).*?(Sentinel-2_L\d[AC])", names["B04"])
    date, product = (m.group(1), m.group(2).replace("_", " ")) if m else ("nieznana", "Sentinel-2")

    # Granica: GeoJSON jest w EPSG:4326, przeliczamy do układu rastra (reprojekcja,
    # a nie samo przypisanie CRS). Piksel należy do obszaru, gdy jego środek leży w wielokącie.
    aoi = json.loads(AOI_PATH.read_text(encoding="utf-8"))
    feats = aoi["features"] if aoi.get("type") == "FeatureCollection" else [aoi]
    geoms = [transform_geom("EPSG:4326", profile["crs"], f.get("geometry", f)) for f in feats]
    inside = geometry_mask(geoms, out_shape=(profile["height"], profile["width"]),
                           transform=profile["transform"], invert=True, all_touched=False)
    if not inside.any():
        sys.exit(f"Granica nie przecina rastra - sprawdź współrzędne {AOI_PATH.name}.")
    # Wycinek z Copernicus Browser musi obejmować całą granicę, inaczej część miasta zostanie pusta
    xs = [c[0] for g in geoms for ring in (g["coordinates"] if g["type"] == "Polygon"
          else [r for p in g["coordinates"] for r in p]) for c in ring]
    ys = [c[1] for g in geoms for ring in (g["coordinates"] if g["type"] == "Polygon"
          else [r for p in g["coordinates"] for r in p]) for c in ring]
    west, south, east, north = array_bounds(profile["height"], profile["width"], profile["transform"])
    if min(xs) < west or min(ys) < south or max(xs) > east or max(ys) > north:
        print("UWAGA: granica wychodzi poza pobrany wycinek - część miasta zostanie pusta. "
              "Pobierz w Copernicus Browser większy obszar.")

    # Maska jakości. Eksport z Copernicus Browser ma już reflektancję (skala 1, offset 0)
    # i nie zawiera warstwy QA, dlatego odrzucamy tylko:
    #   - wypełnienie: 0 we wszystkich kanałach jednocześnie (poza pasem zobrazowania),
    #   - wartości nieskończone / NaN,
    #   - reflektancję poza zakresem (0, 1] w którymkolwiek kanale (nasycenie, odblaski).
    # 0 w pojedynczym kanale NIE jest brakiem danych - odrzuca je dopiero reguła zakresu.
    stack = np.stack([raw[b] for b in BANDS])
    fill = np.all(stack == 0, axis=0)
    finite = np.all(np.isfinite(stack), axis=0)
    in_range = np.all((stack > 0) & (stack <= 1), axis=0)
    valid = inside & ~fill & finite & in_range

    reflectance = {b: np.where(valid, raw[b], np.nan).astype("float32") for b in BANDS}
    return {
        "raw": raw, "reflectance": reflectance, "profile": profile,
        "inside": inside, "valid": valid, "geoms_4326": [f.get("geometry", f) for f in feats],
        "metadata": {"product": product, "date": date, "files": names,
                     "rejected_fill": int((inside & fill).sum()),
                     "rejected_range": int((inside & ~fill & ~(finite & in_range)).sum())},
    }


# ----------------------------------------------------------------------------
# 2. Wskaźniki
# ----------------------------------------------------------------------------
def normalized_difference(a, b):
    """(a - b) / (a + b); NaN tam, gdzie brak danych lub mianownik bliski zeru."""
    a = np.asarray(a, dtype="float32")
    b = np.asarray(b, dtype="float32")
    denominator = a + b
    out = np.full(a.shape, np.nan, dtype="float32")
    np.divide(a - b, denominator, out=out,
              where=np.isfinite(a) & np.isfinite(b) & (np.abs(denominator) > 1e-6))
    return out


def calculate_indices(reflectance):
    return {name: normalized_difference(reflectance[a], reflectance[b])
            for name, (a, b) in INDEX_BANDS.items()}


def stretch_rgb(reflectance):
    """Kompozycja B04/B03/B02 z rozciągnięciem kontrastu 2-98 percentyl; zwraca RGBA uint8."""
    channels = []
    for band in ("B04", "B03", "B02"):
        a = reflectance[band]
        lo, hi = np.nanpercentile(a, [2, 98])
        channels.append(np.clip((a - lo) / (hi - lo), 0, 1))
    alpha = np.isfinite(reflectance["B04"])
    rgb = [np.where(alpha, c * 255, 0).astype("uint8") for c in channels]
    return np.stack(rgb + [(alpha * 255).astype("uint8")])


# ----------------------------------------------------------------------------
# 3. Eksport: GeoTIFF, kolory, kafelki, summary.json
# ----------------------------------------------------------------------------
def write_geotiff(path, array, profile):
    out = dict(driver="GTiff", dtype="float32", count=1, nodata=NODATA,
               crs=profile["crs"], transform=profile["transform"],
               width=profile["width"], height=profile["height"],
               compress="deflate", predictor=3)
    with rasterio.open(path, "w", **out) as dst:
        dst.write(np.where(np.isfinite(array), array, NODATA).astype("float32"), 1)
    # Kontrola odczytu: wartości i georeferencja muszą wrócić bez zmian
    with rasterio.open(path) as src:
        restored = src.read(1, masked=True).filled(np.nan)
        np.testing.assert_allclose(restored, array, equal_nan=True)
        assert src.crs == profile["crs"] and src.transform == profile["transform"]


def build_lut(hex_colors):
    """256 barw interpolowanych liniowo między punktami skali (tak samo jak w script.js)."""
    stops = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in hex_colors], dtype=float)
    t = np.arange(256) / 255 * (len(stops) - 1)
    lo = np.floor(t).astype(int)
    hi = np.minimum(lo + 1, len(stops) - 1)
    f = (t - lo)[:, None]
    return np.round(stops[lo] + (stops[hi] - stops[lo]) * f).astype("uint8")


def colorize(index, name):
    """Wskaźnik -> RGBA uint8. Kolor ma stały zakres [-1, 1]; brak danych jest przezroczysty."""
    lut = build_lut(RAMPS[name])
    ok = np.isfinite(index)
    pos = np.zeros(index.shape, dtype=int)
    pos[ok] = np.clip(np.round((index[ok] + 1) / 2 * 255), 0, 255).astype(int)
    rgb = lut[pos]
    rgb[~ok] = 0
    return np.concatenate([np.moveaxis(rgb, -1, 0), (ok * 255).astype("uint8")[None]])


R_MERC = 6378137.0
HALF = math.pi * R_MERC


def tile_range(bounds_4326, zoom):
    """Zakres kafelków XYZ pokrywający prostokąt w stopniach (y rośnie na południe)."""
    west, south, east, north = bounds_4326
    n = 2 ** zoom

    def xy(lon, lat):
        x = (lon + 180) / 360 * n
        y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
        return int(math.floor(x)), int(math.floor(y))

    x0, y0 = xy(west, north)
    x1, y1 = xy(east - 1e-12, south + 1e-12)
    return range(x0, x1 + 1), range(y0, y1 + 1)


def write_tiles(rgba, profile, bounds_4326, layer):
    """Reprojekcja kolorowego rastra do EPSG:3857 i zapis kafelków z/x/y.png (nearest)."""
    layer_dir = TILE_DIR / layer
    if layer_dir.exists():
        shutil.rmtree(layer_dir)
    count = 0
    for zoom in range(MINZOOM, MAXZOOM + 1):
        size = 2 * HALF / 2 ** zoom
        xs, ys = tile_range(bounds_4326, zoom)
        for x in xs:
            (layer_dir / str(zoom) / str(x)).mkdir(parents=True, exist_ok=True)
            for y in ys:
                left, top = -HALF + x * size, HALF - y * size
                dst = np.zeros((4, 256, 256), dtype="uint8")
                reproject(rgba, dst,
                          src_transform=profile["transform"], src_crs=profile["crs"],
                          dst_transform=from_bounds(left, top - size, left + size, top, 256, 256),
                          dst_crs="EPSG:3857", resampling=Resampling.nearest)
                Image.fromarray(np.moveaxis(dst, 0, -1), "RGBA").save(
                    layer_dir / str(zoom) / str(x) / f"{y}.png", optimize=True)
                count += 1
    return count


def index_stats(a):
    v = a[np.isfinite(a)]
    return {"count": int(v.size), "min": float(v.min()), "max": float(v.max()),
            "mean": float(v.mean()), "median": float(np.median(v)),
            "outside_minus1_plus1": int((np.abs(v) > 1).sum())}


def export_results(scene, indices):
    profile = scene["profile"]
    RASTER_DIR.mkdir(parents=True, exist_ok=True)

    # Zasięg kafelków = prostokąt wokół granicy, w stopniach
    xs, ys = [], []

    def collect(c):
        if isinstance(c[0], (int, float)):
            xs.append(c[0]); ys.append(c[1])
        else:
            for part in c:
                collect(part)
    for g in scene["geoms_4326"]:
        collect(g["coordinates"])
    bounds = (min(xs), min(ys), max(xs), max(ys))

    tiles = {"RGB": write_tiles(stretch_rgb(scene["reflectance"]), profile, bounds, "RGB")}
    for name, array in indices.items():
        write_geotiff(RASTER_DIR / f"{name}.tif", array, profile)
        tiles[name] = write_tiles(colorize(array, name), profile, bounds, name)

    meta = scene["metadata"]
    summary = {
        "city": CITY,
        "aoi": AOI_PATH.relative_to(ROOT).as_posix(),
        "product": meta["product"],
        "date": meta["date"],
        "source": "Copernicus Browser, eksport TIFF 32-bit float (reflektancja)",
        "files": meta["files"],
        "shape": [profile["height"], profile["width"]],
        "crs": str(profile["crs"]),
        "scale_factor": 1.0,
        "add_offset": 0.0,
        "nodata": NODATA,
        "inside_pixels": int(scene["inside"].sum()),
        "valid_pixels": int(scene["valid"].sum()),
        "rejected_fill": meta["rejected_fill"],
        "rejected_out_of_range": meta["rejected_range"],
        "quality_mask": "granica AOI; odrzucone: wypełnienie (0 we wszystkich kanałach), "
                        "NaN, reflektancja poza (0, 1]. Brak warstwy chmur w danych wejściowych.",
        "index_bands": {k: list(v) for k, v in INDEX_BANDS.items()},
        "indices": {name: index_stats(a) for name, a in indices.items()},
        "bounds": [[bounds[1], bounds[0]], [bounds[3], bounds[2]]],
        "minzoom": MINZOOM,
        "maxzoom": MAXZOOM,
        "tiles": tiles,
    }
    SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return summary


# ----------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Wskaźniki Sentinel-2 i kafelki mapy dla jednego miasta.")
    parser.add_argument("miasto", help="identyfikator miasta, np. krakow lub gdansk "
                                       "(dane w data/<miasto>/scene, granica w site/aoi/<miasto>.geojson)")
    set_city(parser.parse_args().miasto)
    if not AOI_PATH.exists():
        sys.exit(f"Brak granicy {AOI_PATH.relative_to(ROOT)}.")

    scene = load_scene()
    meta, profile = scene["metadata"], scene["profile"]
    print("Miasto:", CITY)
    print("Scena:", meta["product"], "| data:", meta["date"])
    print("Wymiary:", profile["height"], "x", profile["width"], "| CRS:", profile["crs"])
    inside, valid = int(scene["inside"].sum()), int(scene["valid"].sum())
    print("Piksele w granicy:", inside, "| ważne:", valid, "| odrzucone:", inside - valid)

    indices = calculate_indices(scene["reflectance"])
    # Przykład kontrolny: NIR 0.6, RED 0.2 -> 0.5; równe kanały -> 0; dwa zera -> NaN
    print("Kontrola wzoru:", normalized_difference([.6, .2, 0], [.2, .2, 0]))

    summary = export_results(scene, indices)
    for name, s in summary["indices"].items():
        print(f"{name:6s} średnia {s['mean']:.4f}  mediana {s['median']:.4f}  "
              f"poza [-1,1]: {s['outside_minus1_plus1']}")
    print("Kafelki:", summary["tiles"], "| razem:", sum(summary["tiles"].values()))
    print(f"Zasięg (do site/cities.js, pole bounds dla '{CITY}'):", summary["bounds"])
    print(f"Gotowe: outputs/{CITY}/rasters, site/tiles/{CITY}, site/summary/{CITY}.json")


if __name__ == "__main__":
    main()
