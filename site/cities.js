// Miasta dostępne na stronie. Klucz (np. 'gdansk') to identyfikator używany w ścieżkach:
//   tiles/<id>/<WARSTWA>/z/x/y.png, aoi/<id>.geojson, summary/<id>.json
// Nowe miasto: dane w data/<id>/scene, granica w site/aoi/<id>.geojson,
// `python3 src/sentinel_do_www.py <id>`, a potem wpis poniżej (bounds wypisuje skrypt).
// Pierwsze miasto na liście otwiera się domyślnie.
const CITIES = {
    krakow: {
        name: 'Kraków',
        bounds: [[49.88179574048013, 19.51647831238569], [50.31643063423191, 20.357173391669342]],
        places: [
            { name: 'Stare Miasto',     hint: 'zabudowa • NDBI',   ll: [50.0617, 19.9373], z: 14, layer: 'NDBI' },
            { name: 'Kombinat N. Huta', hint: 'przemysł • NDBI',   ll: [50.0780, 20.1000], z: 13, layer: 'NDBI' },
            { name: 'Las Wolski',       hint: 'las • NDVI',        ll: [50.0550, 19.8500], z: 14, layer: 'NDVI' },
            { name: 'Zalew Kryspinów',  hint: 'woda • MNDWI',      ll: [50.0470, 19.7900], z: 14, layer: 'MNDWI' },
            { name: 'Zalew Bagry',      hint: 'woda • MNDWI',      ll: [50.0360, 19.9900], z: 14, layer: 'MNDWI' },
            { name: 'Dolina Prądnika',  hint: 'roślinność • NDVI', ll: [50.2100, 19.8300], z: 13, layer: 'NDVI' }
        ]
    },
    gdansk: {
        name: 'Gdańsk',
        bounds: [[54.2749189, 18.4294955], [54.4664485, 18.9502437]],
        places: [
            { name: 'Główne Miasto',      hint: 'zabudowa • NDBI',   ll: [54.3485, 18.6530], z: 14, layer: 'NDBI' },
            { name: 'Stocznia Gdańska',   hint: 'przemysł • NDBI',   ll: [54.3640, 18.6450], z: 14, layer: 'NDBI' },
            { name: 'Lasy Oliwskie',      hint: 'las • NDVI',        ll: [54.4100, 18.5300], z: 13, layer: 'NDVI' },
            { name: 'Martwa Wisła',       hint: 'woda • MNDWI',      ll: [54.3560, 18.6900], z: 13, layer: 'MNDWI' },
            { name: 'Wyspa Sobieszewska', hint: 'roślinność • NDVI', ll: [54.3420, 18.8300], z: 13, layer: 'NDVI' }
        ]
    }
};
