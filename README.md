# Dane wejściowe

Plików sceny (TIFF) nie ma w repozytorium – są w `.gitignore`. Żeby uruchomić `sentinel_do_www.py`, pobierz je samodzielnie:

1. Wejdź na [Copernicus Browser](https://browser.dataspace.copernicus.eu/) i wybierz Sentinel-2 L1C, datę 2026-09-30, obszar Krakowa.
2. Pobierz kanały **B02, B03, B04, B08, B11** jako dane surowe („Raw”), format TIFF 32-bit float, układ WGS 84.
3. Zapisz pliki w `data/scene/`, nie zmieniając nazw (skrypt rozpoznaje kanał po fragmencie `_B04_` w nazwie).

Następnie:

```bash
python3 -m pip install rasterio numpy pillow
python3 sentinel_do_www.py
```

Zawiera zmodyfikowane dane Copernicus Sentinel 2026.