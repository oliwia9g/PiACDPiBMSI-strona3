# Satelitarne wskaźniki pokrycia terenu — Copernicus + granice PRG

Wersja zachowuje interfejs głównego projektu, ale zamiast lokalnych `tiles_new_big` pobiera i oblicza warstwy Sentinel-2 L2A dynamicznie przez Copernicus Data Space / Sentinel Hub Process API.

## Co zostało dodane

- wybór miasta: **Kraków, Gdańsk, Tarnów**,
- dokładne granice administracyjne miast pobierane automatycznie z **Państwowego Rejestru Granic (PRG, GUGiK)**,
- bbox każdego miasta liczony automatycznie z geometrii PRG,
- geometria miasta przekazywana do zapytania Copernicus jako AOI,
- obraz po obu stronach suwaka jest dodatkowo maskowany do granicy administracyjnej,
- osobny rok i miesiąc dla prawej i lewej strony,
- porównanie tego samego wskaźnika między różnymi okresami,
- dynamiczne NDVI, NDBI, MNDWI, NDWI, NDMI i RGB,
- zachowane: podkłady, opacity, legendy, opisy, współrzędne, odczyt punktowy, histogram, statystyki widoku, reset, fullscreen, link do widoku i ciekawe miejsca.

## Granice administracyjne

Nie trzeba ręcznie pobierać GeoJSON-ów. `server.js` przy uruchomieniu pobiera z oficjalnej usługi OGC API Features PRG granicę gminy dla kodów TERYT:

- Kraków — `1261011`,
- Gdańsk — `2261011`,
- Tarnów — `1263011`.

Po pobraniu geometria jest trzymana w pamięci serwera. Jeśli PRG jest chwilowo niedostępne, aplikacja nadal się uruchomi na awaryjnym bbox-ie, a w pasku stanu pojawi się informacja `bbox awaryjny` zamiast `granica PRG`.

Źródło granic: Państwowy Rejestr Granic, Główny Urząd Geodezji i Kartografii.

## Uruchomienie

1. Skopiuj `.env.example` jako `.env`.
2. Wpisz do `.env` swój `CDSE_CLIENT_ID` i `CDSE_CLIENT_SECRET`.
3. W terminalu w katalogu projektu:

```bash
npm.cmd install
npm.cmd start
```

4. Otwórz `http://localhost:3000`.

Nie uruchamiaj tej wersji przez Live Server — sekret OAuth pozostaje po stronie `server.js`.

## Ważne

- `.env` jest w `.gitignore` i nie powinien trafić do repozytorium.
- `tiles_new_big` nie jest potrzebny w tej wersji.
- `aoi.geojson` i `summary.json` pozostawiono jako pliki z oryginalnego projektu, ale nie sterują już bieżącym AOI ani statystykami.
- Statystyki i odczyt punktowy uwzględniają aktualnie wybrane miasto; piksele poza jego granicą administracyjną są pomijane.
- Przy pierwszym kliknięciu mapy aplikacja może pobrać dodatkowe warstwy dla pozostałych wskaźników, żeby zachować popup ze wszystkimi wartościami. Potem są one buforowane w pamięci.
