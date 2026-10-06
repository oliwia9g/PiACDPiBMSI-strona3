const cfg = {
    "bounds": [[49.88179574048013, 19.51647831238569], [50.31643063423191, 20.357173391669342]],
    "minzoom": 9,
    "maxzoom": 12,
    "date": "2013-08-07",
    "ramps": {
        "NDVI": ["#a50026", "#de3f2e", "#f88e52", "#fdd481", "#fefebd", "#cbe881", "#84ca66", "#2a9f54", "#006837"],
        "NDBI": ["#2d004b", "#5f3a91", "#998fbf", "#cfcee5", "#f7f6f5", "#fdd59f", "#ed9b39", "#bc6109", "#7f3b08"],
        "MNDWI": ["#543005", "#995d12", "#cfa255", "#f0dfb2", "#f4f4f4", "#b3e2db", "#58b0a6", "#0c7068", "#003c30"]
    }
};

const map = L.map('map', {
    minZoom: cfg.minzoom,
    maxZoom: 17
}).fitBounds(cfg.bounds);

// Funkcja 2: Pasek skali (w kilometrach)
L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const text = {
    NDVI: 'NDVI = (B5 − B4) / (B5 + B4). Wysokie wartości często odpowiadają roślinności.',
    NDBI: 'NDBI = (B6 − B5) / (B6 + B5). Dodatni wynik może wskazywać zabudowę lub odsłoniętą glebę.',
    MNDWI: 'MNDWI = (B3 − B6) / (B3 + B6). Wskaźnik wspiera rozpoznawanie wód powierzchniowych.',
    RGB: 'Kompozycja B4/B3/B2. Kontrast: percentyle 2–98 osobno dla kanałów. Kolory służą interpretacji obrazu.'
};

let overlay;

function change() {
    const name = document.querySelector('#layer').value;
    
    if (overlay) {
        map.removeLayer(overlay);
    }
    
    overlay = L.tileLayer('tiles/' + name + '/{z}/{x}/{y}.png', {
        tileSize: 256,
        tms: false,
        minZoom: cfg.minzoom,
        maxNativeZoom: cfg.maxzoom,
        maxZoom: 17,
        bounds: cfg.bounds,
        noWrap: true,
        opacity: Number(document.querySelector('#opacity').value),
        attribution: 'Landsat 8 / USGS'
    }).addTo(map);
    
    document.querySelector('#explain').textContent = text[name];
    document.querySelector('#legend').hidden = name === 'RGB';
    
    if (name !== 'RGB') {
        document.querySelector('#ramp').style.background = 'linear-gradient(to right,' + cfg.ramps[name].join(',') + ')';
    }
    
    overlay.on('load', () => document.querySelector('#state').textContent = 'Warstwa ' + name + ' gotowa.');
    overlay.on('tileerror', () => document.querySelector('#state').textContent = 'Nie udało się odczytać kafelka. Sprawdź, czy przesłano cały katalog tiles.');
}

// Zdarzenia (Events)
document.querySelector('#layer').addEventListener('change', change);
document.querySelector('#opacity').addEventListener('input', e => overlay.setOpacity(Number(e.target.value)));
document.querySelector('#reset').addEventListener('click', () => map.fitBounds(cfg.bounds));

// Wyświetlanie współrzędnych kursora
const coordsControl = L.control({ position: 'bottomleft' });

coordsControl.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'coords-info');
    this._div.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    this._div.style.padding = '5px 10px';
    this._div.style.borderRadius = '4px';
    this._div.style.fontSize = '12px';
    this._div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    this._div.innerHTML = 'Współrzędne: najedź na mapę';
    return this._div;
};
coordsControl.addTo(map);

map.on('mousemove', function(e) {
    coordsControl._div.innerHTML = `N: ${e.latlng.lat.toFixed(5)}°<br>E: ${e.latlng.lng.toFixed(5)}°`;
});

// Pobieranie granic z pliku geojson
fetch('aoi.geojson')
    .then(r => {
        if (!r.ok) throw Error(r.status);
        return r.json();
    })
    .then(g => L.geoJSON(g, {
        style: { color: '#143843', weight: 1.2, fill: false },
        interactive: false
    }).addTo(map))
    .catch(() => {
        document.querySelector('#state').textContent = 'Granica niedostępna; otwórz mapę przez serwer HTTP.';
    });

// Inicjalizacja pierwszej warstwy
change();