const cfg = {
    "bounds": [[49.88179574048013, 19.51647831238569], [50.31643063423191, 20.357173391669342]],
    "minzoom": 9,
    "maxzoom": 12,
    "ramps": {
        "NDVI": ["#a50026", "#de3f2e", "#f88e52", "#fdd481", "#fefebd", "#cbe881", "#84ca66", "#2a9f54", "#006837"],
        "NDBI": ["#2d004b", "#5f3a91", "#998fbf", "#cfcee5", "#f7f6f5", "#fdd59f", "#ed9b39", "#bc6109", "#7f3b08"],
        "MNDWI": ["#543005", "#995d12", "#cfa255", "#f0dfb2", "#f4f4f4", "#b3e2db", "#58b0a6", "#0c7068", "#003c30"],
        "NDWI": ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4"],
        "NDMI": ["#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e"]
    }
};

const map = L.map('map', {
    minZoom: cfg.minzoom,
    maxZoom: 17
}).fitBounds(cfg.bounds);

L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

// Globalny podkład OSM
const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Pusta warstwa dla lewej strony suwaka (NAPRAWA BŁĘDU)
const emptyLayer = L.tileLayer('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7').addTo(map);

const text = {
    NDVI: 'Wysokie wartości często odpowiadają gęstej, zdrowej roślinności.',
    NDBI: 'Dodatni wynik może wskazywać zabudowę lub odsłoniętą glebę.',
    MNDWI: 'Wskaźnik wspierający rozpoznawanie wód powierzchniowych w terenach zurbanizowanych.',
    NDWI: 'Wskaźnik służący do detekcji zbiorników wodnych.',
    NDMI: 'Wskaźnik obrazujący poziom wilgotności roślinności (stres wodny).',
    RGB: 'Kompozycja barwna. Kontrast wyrównany, kolory służą do ogólnej interpretacji obrazu.'
};

let overlay;
let sideBySideControl;

function change() {
    const name = document.querySelector('#layer').value;
    
    if (overlay) map.removeLayer(overlay);
    if (sideBySideControl) map.removeControl(sideBySideControl);
    
    overlay = L.tileLayer('tiles_new/' + name + '_new/{z}/{x}/{y}.png', {
        tileSize: 256,
        tms: false,
        minZoom: cfg.minzoom,
        maxNativeZoom: cfg.maxzoom,
        maxZoom: 17,
        bounds: cfg.bounds,
        noWrap: true,
        opacity: Number(document.querySelector('#opacity').value),
        attribution: 'Własne opracowanie'
    }).addTo(map);
    
    sideBySideControl = L.control.sideBySide(emptyLayer, overlay).addTo(map);
    
    // Blokada przesuwania mapy podczas przeciągania suwaka
    const sbsRange = document.querySelector('.leaflet-sbs-range');
    if (sbsRange) {
        sbsRange.addEventListener('mousedown', () => map.dragging.disable());
        sbsRange.addEventListener('touchstart', () => map.dragging.disable(), {passive: true});
        document.addEventListener('mouseup', () => map.dragging.enable());
        document.addEventListener('touchend', () => map.dragging.enable());
    }
    
    document.querySelector('#explain').textContent = text[name];
    document.querySelector('#legend').hidden = name === 'RGB';
    
    if (name !== 'RGB') {
        document.querySelector('#ramp').style.background = 'linear-gradient(to right,' + cfg.ramps[name].join(',') + ')';
    }
    
    overlay.on('load', () => document.querySelector('#state').textContent = 'Warstwa ' + name + ' wczytana.');
    overlay.on('tileerror', () => document.querySelector('#state').textContent = 'Błąd wczytywania kafelków.');
}

document.querySelector('#layer').addEventListener('change', change);
document.querySelector('#opacity').addEventListener('input', e => overlay.setOpacity(Number(e.target.value)));
document.querySelector('#reset').addEventListener('click', () => map.fitBounds(cfg.bounds));

const coordsControl = L.control({ position: 'bottomleft' });
coordsControl.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'coords-info');
    this._div.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    this._div.style.padding = '6px 12px';
    this._div.style.borderRadius = '6px';
    this._div.style.fontSize = '12px';
    this._div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    this._div.innerHTML = 'Współrzędne: najedź na mapę';
    return this._div;
};
coordsControl.addTo(map);

map.on('mousemove', function(e) {
    coordsControl._div.innerHTML = `N: ${e.latlng.lat.toFixed(5)}°<br>E: ${e.latlng.lng.toFixed(5)}°`;
});

fetch('aoi.geojson')
    .then(r => r.ok ? r.json() : null)
    .then(g => {
        if(g) L.geoJSON(g, { style: { color: '#2c3e50', weight: 1.5, fill: false }, interactive: false }).addTo(map);
    });

change();