# Satelitarne wskaźniki pokrycia terenu • Sentinel-2 • Grupa 3

```
src/sentinel_do_www.py     obliczenia: wskaźniki, GeoTIFF, kafelki, statystyki
site/                      gotowa strona – ten folder publikujemy na serwerze
  index.html, script.js, style.css, logo.svg
  cities.js                lista miast: nazwa, zasięg, ciekawe miejsca
  vendor/                  Leaflet i suwak (lokalnie, bez internetu)
  aoi/<miasto>.geojson     granica miasta, EPSG:4326
  tiles/<miasto>/<WARSTWA>/z/x/y.png
  summary/<miasto>.json    statystyki obliczeń
data/<miasto>/scene/       kanały TIFF z Copernicus Browser (poza gitem)
outputs/<miasto>/rasters/  GeoTIFF float32 wskaźników (poza gitem)
tiles_new_big/             starsze kafelki Krakowa – strona ich nie używa
```

Każde miasto ma własne pliki, więc obliczenia jednego nie nadpisują drugiego.

# Dane wejściowe

Plików sceny (TIFF) nie ma w repozytorium – folder `data/` jest w `.gitignore`. Żeby uruchomić skrypt, pobierz je samodzielnie:

1. Wejdź na [Copernicus Browser](https://browser.dataspace.copernicus.eu/), wybierz Sentinel-2 L1C, datę sceny i zaznacz prostokąt **większy niż granica miasta**.
2. Pobierz kanały **B02, B03, B04, B08, B11** jako dane surowe („Raw”), format TIFF 32-bit float, układ WGS 84.
3. Zapisz pliki w `data/<miasto>/scene/`, nie zmieniając nazw (skrypt rozpoznaje kanał po fragmencie `_B04_` w nazwie).

# Obliczenia

```bash
python3 -m venv .venv
.venv/bin/python -m pip install rasterio numpy pillow
.venv/bin/python src/sentinel_do_www.py gdansk      # albo: krakow
```

Nowe miasto: dane do `data/<id>/scene/`, granica do `site/aoi/<id>.geojson`, uruchom skrypt z `<id>` i dopisz wpis w `site/cities.js` (zasięg `bounds` wypisuje skrypt).

# Podgląd i publikacja

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory site
```

Otwórz http://127.0.0.1:8000/ (pierwsze miasto z `cities.js`) albo http://127.0.0.1:8000/?miasto=gdansk. Na serwer AGH wysyłamy zawartość `site/` (`scp -r site/. ...`), tak jak w konspekcie.

Granica Gdańska pochodzi z OpenStreetMap (relacja 2597485, © OpenStreetMap contributors, ODbL) i obejmuje też część wód Zatoki Gdańskiej.

Zawiera zmodyfikowane dane Copernicus Sentinel 2026.
