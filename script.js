const cfg = {
    bounds: [[49.88179574048013, 19.51647831238569], [50.31643063423191, 20.357173391669342]],
    minzoom: 9,
    maxzoom: 17,
    ramps: {
        NDVI: ["#a50026", "#de3f2e", "#f88e52", "#fdd481", "#fefebd", "#cbe881", "#84ca66", "#2a9f54", "#006837"],
        NDBI: ["#2d004b", "#5f3a91", "#998fbf", "#cfcee5", "#f7f6f5", "#fdd59f", "#ed9b39", "#bc6109", "#7f3b08"],
        MNDWI: ["#543005", "#995d12", "#cfa255", "#f0dfb2", "#f4f4f4", "#b3e2db", "#58b0a6", "#0c7068", "#003c30"],
        NDWI: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4"],
        NDMI: ["#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e"]
    }
};

const INFO = {
    NDVI:  { formula: 'NDVI = (NIR − RED) / (NIR + RED)',       thr: 0.4, thrLabel: 'gęsta roślinność (> 0,4)',
             text: 'Wysokie wartości często odpowiadają gęstej, zdrowej roślinności.' },
    NDBI:  { formula: 'NDBI = (SWIR1 − NIR) / (SWIR1 + NIR)',   thr: 0,   thrLabel: 'zabudowa / goła gleba (> 0)',
             text: 'Dodatni wynik może wskazywać zabudowę lub odsłoniętą glebę.' },
    MNDWI: { formula: 'MNDWI = (GREEN − SWIR1) / (GREEN + SWIR1)', thr: 0, thrLabel: 'woda (> 0)',
             text: 'Wskaźnik wspierający rozpoznawanie wód powierzchniowych w terenach zurbanizowanych.' },
    NDWI:  { formula: 'NDWI = (GREEN − NIR) / (GREEN + NIR)',   thr: 0,   thrLabel: 'woda (> 0)',
             text: 'Wskaźnik służący do detekcji zbiorników wodnych.' },
    NDMI:  { formula: 'NDMI = (NIR − SWIR1) / (NIR + SWIR1)',   thr: 0.2, thrLabel: 'wysoka wilgotność (> 0,2)',
             text: 'Wskaźnik obrazujący poziom wilgotności roślinności (stres wodny).' },
    RGB:   { formula: '',
             text: 'Kompozycja barwna. Kontrast wyrównany, kolory służą do ogólnej interpretacji obrazu.' }
};
const LAYERS = Object.keys(INFO);
const INDICES = LAYERS.filter(n => n !== 'RGB');

const CITIES = {
    krakow: {
        name: 'Kraków',
        teryt: '1261011',
        bbox: [19.75, 49.95, 20.25, 50.18],
        geometry: null,
        exact: false,
        places: [
            { name: 'Stare Miasto',     hint: 'zabudowa • NDBI',   ll: [50.0617, 19.9373], z: 14, layer: 'NDBI' },
            { name: 'Kombinat N. Huta', hint: 'przemysł • NDBI',   ll: [50.0780, 20.1000], z: 13, layer: 'NDBI' },
            { name: 'Las Wolski',       hint: 'las • NDVI',        ll: [50.0550, 19.8500], z: 14, layer: 'NDVI' },
            { name: 'Zalew Kryspinów',  hint: 'woda • MNDWI',      ll: [50.0470, 19.7900], z: 14, layer: 'MNDWI' },
            { name: 'Zalew Bagry',      hint: 'woda • NDWI',       ll: [50.0360, 19.9900], z: 14, layer: 'NDWI' },
            { name: 'Dolina Prądnika',  hint: 'wilgotność • NDMI', ll: [50.2100, 19.8300], z: 13, layer: 'NDMI' }
        ]
    },
    gdansk: {
        name: 'Gdańsk',
        teryt: '2261011',
        bbox: [18.45, 54.25, 18.95, 54.55],
        geometry: null,
        exact: false,
        places: [
            { name: 'Główne Miasto',      hint: 'zabudowa • NDBI', ll: [54.3498, 18.6533], z: 14, layer: 'NDBI' },
            { name: 'Port Gdańsk',         hint: 'port • NDBI',     ll: [54.3890, 18.6900], z: 13, layer: 'NDBI' },
            { name: 'Park Oliwski',        hint: 'zieleń • NDVI',   ll: [54.4106, 18.5592], z: 14, layer: 'NDVI' },
            { name: 'Brzeźno',             hint: 'woda • NDWI',     ll: [54.4077, 18.6355], z: 14, layer: 'NDWI' },
            { name: 'Wyspa Sobieszewska',  hint: 'zieleń • NDVI',   ll: [54.3370, 18.8580], z: 13, layer: 'NDVI' }
        ]
    },
    tarnow: {
        name: 'Tarnów',
        teryt: '1263011',
        bbox: [20.80, 49.90, 21.20, 50.12],
        geometry: null,
        exact: false,
        places: [
            { name: 'Rynek',               hint: 'zabudowa • NDBI', ll: [50.0124, 20.9880], z: 15, layer: 'NDBI' },
            { name: 'Mościce',             hint: 'przemysł • NDBI', ll: [50.0115, 20.9100], z: 14, layer: 'NDBI' },
            { name: 'Góra św. Marcina',    hint: 'zieleń • NDVI',   ll: [49.9845, 21.0170], z: 14, layer: 'NDVI' },
            { name: 'Dunajec',             hint: 'woda • NDWI',     ll: [50.0000, 20.8650], z: 14, layer: 'NDWI' }
        ]
    }
};

const MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

const BASEMAPS = {
    OSM:      { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
    Satelita: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles © Esri, Maxar, Earthstar Geographics' },
    Brak:     null
};

const $ = s => document.querySelector(s);
const fmt = v => v.toFixed(2).replace('.', ',').replace('-', '−');
const cityBounds = key => {
    const [w, s, e, n] = CITIES[key].bbox;
    return [[s, w], [n, e]];
};

function pointInRing(lng, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        const hit = ((yi > lat) !== (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / ((yj - yi) || Number.EPSILON) + xi);
        if (hit) inside = !inside;
    }
    return inside;
}

function pointInGeometry(lng, lat, geometry) {
    if (!geometry) return false;
    const insidePolygon = polygon => {
        if (!polygon?.length || !pointInRing(lng, lat, polygon[0])) return false;
        for (let i = 1; i < polygon.length; i++) if (pointInRing(lng, lat, polygon[i])) return false;
        return true;
    };
    if (geometry.type === 'Polygon') return insidePolygon(geometry.coordinates);
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.some(insidePolygon);
    return false;
}

function insideCity(cityKey, latlng) {
    const city = CITIES[cityKey];
    if (!city) return false;
    const [w, s, e, n] = city.bbox;
    if (latlng.lng < w || latlng.lng > e || latlng.lat < s || latlng.lat > n) return false;
    return city.geometry ? pointInGeometry(latlng.lng, latlng.lat, city.geometry) : true;
}

async function loadOfficialBoundaries() {
    try {
        const response = await fetch('/api/cities', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        for (const [key, value] of Object.entries(data)) {
            if (!CITIES[key] || !Array.isArray(value.bbox) || value.bbox.length < 4) continue;
            CITIES[key].bbox = value.bbox.map(Number);
            CITIES[key].geometry = value.geometry || null;
            CITIES[key].exact = Boolean(value.exact && value.geometry);
            CITIES[key].boundarySource = value.source || '';
            CITIES[key].prgId = value.prgId || null;
        }
        return true;
    } catch (err) {
        console.warn('Nie udało się pobrać dokładnych granic PRG; używam bbox-ów awaryjnych.', err);
        return false;
    }
}

let selectedCity = $('#city-select').value || 'krakow';
cfg.bounds = cityBounds(selectedCity);

const map = L.map('map', {
    minZoom: 7,
    maxZoom: 17,
    zoomAnimation: false,
    fadeAnimation: false
}).fitBounds(cfg.bounds);

L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

const osmLayer = L.tileLayer(BASEMAPS.OSM.url, {
    maxZoom: 19,
    attribution: BASEMAPS.OSM.attr
}).addTo(map);
osmLayer.setZIndex(0);
let baseLayer = osmLayer;

function setBasemap(key) {
    if (baseLayer) map.removeLayer(baseLayer);
    const b = BASEMAPS[key];
    if (key === 'OSM') baseLayer = osmLayer.addTo(map);
    else baseLayer = b ? L.tileLayer(b.url, { maxZoom: 19, zIndex: 0, attribution: b.attr }).addTo(map) : null;
    document.querySelectorAll('#basemaps .chip').forEach(c => c.classList.toggle('active', c.dataset.key === key));
}

const mapContainer = map.getContainer();
const temporalRoot = L.DomUtil.create('div', 'temporal-root', mapContainer);
const leftClip = L.DomUtil.create('div', 'temporal-clip', temporalRoot);
const rightClip = L.DomUtil.create('div', 'temporal-clip', temporalRoot);
const leftImg = L.DomUtil.create('img', 'temporal-img', leftClip);
const rightImg = L.DomUtil.create('img', 'temporal-img', rightClip);
leftImg.alt = '';
rightImg.alt = '';
leftImg.draggable = false;
rightImg.draggable = false;

const leftLabel = L.DomUtil.create('div', 'side-label temporal-label-left', mapContainer);
leftLabel.id = 'label-left';
const rightLabel = L.DomUtil.create('div', 'side-label temporal-label-right', mapContainer);
rightLabel.id = 'label-right';

const divider = L.DomUtil.create('div', 'swipe-divider', mapContainer);
divider.setAttribute('role', 'slider');
divider.setAttribute('tabindex', '0');
divider.setAttribute('aria-label', 'Pozycja suwaka porównawczego');
divider.setAttribute('aria-valuemin', '0');
divider.setAttribute('aria-valuemax', '100');
divider.setAttribute('aria-valuenow', '50');
const dividerLine = L.DomUtil.create('div', 'divider-line', divider);
const dividerKnob = L.DomUtil.create('span', 'divider-knob', divider);
dividerKnob.textContent = '↔';

const loading = L.DomUtil.create('div', 'temporal-loading', mapContainer);
loading.hidden = true;
loading.innerHTML = '<div class="temporal-spinner"></div><div><strong>Pobieram Sentinel-2…</strong><small>Warstwy są liczone przez Copernicus Data Space.</small></div>';

let swipeRatio = 0.5;
let draggingDivider = false;
let activePointerId = null;
let rightAsset = null;
let leftAsset = null;
let changeToken = 0;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function syncImageGeometry() {
    const b = cityBounds(selectedCity);
    const nw = map.latLngToContainerPoint([b[1][0], b[0][1]]);
    const se = map.latLngToContainerPoint([b[0][0], b[1][1]]);
    const x = nw.x, y = nw.y;
    const w = Math.max(0, se.x - nw.x), h = Math.max(0, se.y - nw.y);
    for (const img of [leftImg, rightImg]) {
        img.style.left = `${x}px`;
        img.style.top = `${y}px`;
        img.style.width = `${w}px`;
        img.style.height = `${h}px`;
    }
    return { x, y, w, h };
}

function geometryRings(geometry) {
    if (!geometry) return [];
    if (geometry.type === 'Polygon') return geometry.coordinates || [];
    if (geometry.type === 'MultiPolygon') return (geometry.coordinates || []).flatMap(p => p);
    return [];
}

function updateAoiImageMask(box) {
    const geometry = CITIES[selectedCity].geometry;
    if (!geometry || box.w <= 0 || box.h <= 0) {
        for (const img of [leftImg, rightImg]) {
            img.style.clipPath = 'none';
            img.style.webkitClipPath = 'none';
        }
        return;
    }

    const path = geometryRings(geometry).map(ring => {
        const points = ring.map(([lng, lat]) => {
            const p = map.latLngToContainerPoint([lat, lng]);
            return `${(p.x - box.x).toFixed(1)} ${(p.y - box.y).toFixed(1)}`;
        });
        return points.length ? `M${points.join('L')}Z` : '';
    }).filter(Boolean).join(' ');

    const clip = path ? `path(evenodd, "${path}")` : 'none';
    for (const img of [leftImg, rightImg]) {
        img.style.clipPath = clip;
        img.style.webkitClipPath = clip;
    }
}

function comparisonMode() {
    return $('#compare').value;
}

function updateSplit() {
    const mode = comparisonMode();
    const width = mapContainer.clientWidth;
    if (!width) return;

    if (mode === 'off') {
        divider.hidden = true;
        leftClip.hidden = true;
        rightClip.hidden = false;
        rightClip.style.clipPath = 'none';
        rightClip.style.webkitClipPath = 'none';
        leftLabel.hidden = true;
        rightLabel.hidden = true;
        return;
    }

    divider.hidden = false;
    rightClip.hidden = false;
    const split = Math.round(width * swipeRatio);
    rightClip.style.clipPath = `inset(0px 0px 0px ${Math.max(0, split)}px)`;
    rightClip.style.webkitClipPath = rightClip.style.clipPath;

    if (mode === 'base') {
        leftClip.hidden = true;
    } else {
        leftClip.hidden = false;
        leftClip.style.clipPath = `inset(0px ${Math.max(0, width - split)}px 0px 0px)`;
        leftClip.style.webkitClipPath = leftClip.style.clipPath;
    }

    divider.style.left = `${split}px`;
    divider.setAttribute('aria-valuenow', String(Math.round(swipeRatio * 100)));
}

function syncAll() {
    const box = syncImageGeometry();
    updateAoiImageMask(box);
    updateSplit();
}

function setSwipeFromClientX(clientX) {
    const rect = mapContainer.getBoundingClientRect();
    swipeRatio = clamp((clientX - rect.left) / rect.width, 0, 1);
    updateSplit();
}

L.DomEvent.disableClickPropagation(divider);
L.DomEvent.disableScrollPropagation(divider);

function startDrag(e) {
    draggingDivider = true;
    activePointerId = e.pointerId ?? null;
    divider.classList.add('dragging');
    map.dragging.disable();
    map.boxZoom.disable();
    if (divider.setPointerCapture && e.pointerId != null) {
        try { divider.setPointerCapture(e.pointerId); } catch (_) {}
    }
    setSwipeFromClientX(e.clientX);
    e.preventDefault?.();
    e.stopPropagation?.();
}
function moveDrag(e) {
    if (!draggingDivider) return;
    setSwipeFromClientX(e.clientX);
    e.preventDefault?.();
    e.stopPropagation?.();
}
function stopDrag(e) {
    if (!draggingDivider) return;
    draggingDivider = false;
    divider.classList.remove('dragging');
    if (divider.releasePointerCapture && activePointerId != null) {
        try { divider.releasePointerCapture(activePointerId); } catch (_) {}
    }
    activePointerId = null;
    map.dragging.enable();
    map.boxZoom.enable();
    e?.preventDefault?.();
    e?.stopPropagation?.();
}

divider.addEventListener('pointerdown', startDrag, { capture: true });
divider.addEventListener('pointermove', moveDrag, { capture: true });
divider.addEventListener('pointerup', stopDrag, { capture: true });
divider.addEventListener('pointercancel', stopDrag, { capture: true });
window.addEventListener('pointerup', stopDrag, { capture: true });
divider.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') swipeRatio = clamp(swipeRatio - 0.02, 0, 1);
    else if (e.key === 'ArrowRight') swipeRatio = clamp(swipeRatio + 0.02, 0, 1);
    else if (e.key === 'Home') swipeRatio = 0;
    else if (e.key === 'End') swipeRatio = 1;
    else return;
    updateSplit();
    e.preventDefault();
});

map.on('move zoom moveend zoomend resize viewreset', syncAll);
window.addEventListener('resize', () => setTimeout(syncAll, 0));

function populateYears(select) {
    const current = new Date().getFullYear();
    select.innerHTML = '';
    for (let y = current; y >= current - 4; y--) {
        const o = document.createElement('option');
        o.value = String(y);
        o.textContent = String(y);
        select.appendChild(o);
    }
}

function populateMonths(select, yearSelect, preferred = 6) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const year = Number(yearSelect.value);
    const previous = Number(select.value || preferred);
    select.innerHTML = '';
    MONTHS.forEach((name, i) => {
        const month = i + 1;
        if (year === currentYear && month > currentMonth) return;
        const o = document.createElement('option');
        o.value = String(month);
        o.textContent = name;
        select.appendChild(o);
    });
    const values = [...select.options].map(o => Number(o.value));
    select.value = String(values.includes(previous) ? previous : values.at(-1));
}

populateYears($('#left-year'));
populateYears($('#right-year'));
const currentYear = new Date().getFullYear();
$('#left-year').value = String(currentYear - 4);
$('#right-year').value = String(currentYear);
populateMonths($('#left-month'), $('#left-year'), 6);
populateMonths($('#right-month'), $('#right-year'), 6);

function temporalSelection(side, indexOverride = null) {
    return {
        city: selectedCity,
        index: indexOverride || (side === 'right' ? $('#layer').value : $('#compare').value),
        year: Number($(`#${side}-year`).value),
        month: Number($(`#${side}-month`).value)
    };
}
function humanLabel(s) { return `${s.index} • ${MONTHS[s.month - 1]} ${s.year}`; }
function assetKey(s) { return `${s.city}|${s.index}|${s.year}|${String(s.month).padStart(2, '0')}`; }

const assetCache = new Map();
const MAX_ASSET_CACHE = 24;

function touchAsset(key, asset) {
    if (assetCache.has(key)) assetCache.delete(key);
    assetCache.set(key, asset);
    while (assetCache.size > MAX_ASSET_CACHE) {
        const firstKey = assetCache.keys().next().value;
        const first = assetCache.get(firstKey);
        if (first === leftAsset || first === rightAsset) {
            assetCache.delete(firstKey);
            assetCache.set(firstKey, first);
            continue;
        }
        assetCache.delete(firstKey);
        try { URL.revokeObjectURL(first.url); } catch (_) {}
    }
}

function decodeImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0);
                resolve({ width: canvas.width, height: canvas.height, imageData: ctx.getImageData(0, 0, canvas.width, canvas.height).data });
            } catch (err) { reject(err); }
        };
        img.onerror = () => reject(new Error('Przeglądarka nie wczytała PNG z warstwą.'));
        img.src = url;
    });
}

async function getAsset(sel) {
    const key = assetKey(sel);
    const cached = assetCache.get(key);
    if (cached) {
        touchAsset(key, cached);
        return cached;
    }

    const qs = new URLSearchParams({
        city: sel.city,
        index: sel.index,
        year: String(sel.year),
        month: String(sel.month)
    });
    const response = await fetch(`/api/layer?${qs}`, { cache: 'no-store' });
    if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try { msg = (await response.json()).error || msg; } catch (_) {}
        throw new Error(msg);
    }
    const blob = await response.blob();
    if (!blob.size) throw new Error(`Pusty obraz: ${humanLabel(sel)}`);
    const url = URL.createObjectURL(blob);
    let decoded;
    try { decoded = await decodeImage(url); }
    catch (err) { URL.revokeObjectURL(url); throw err; }

    const asset = {
        key,
        sel: { ...sel },
        url,
        bytes: blob.size,
        hash: response.headers.get('X-Temporal-Hash') || '?',
        width: decoded.width,
        height: decoded.height,
        imageData: decoded.imageData
    };
    touchAsset(key, asset);
    return asset;
}

function setLoading(on) {
    loading.hidden = !on;
    $('#city-select').disabled = on;
}
function setState(text, error = false) {
    const el = $('#state');
    el.textContent = text;
    el.classList.toggle('error', error);
}

const LUT = {};
const MEMO = {};
for (const name of INDICES) {
    const stops = cfg.ramps[name].map(h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; });
    const lut = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
        const t = i / 255 * (stops.length - 1);
        const a = Math.floor(t), b = Math.min(a + 1, stops.length - 1), f = t - a;
        for (let k = 0; k < 3; k++) lut[i * 3 + k] = Math.round(stops[a][k] + (stops[b][k] - stops[a][k]) * f);
    }
    LUT[name] = lut;
    MEMO[name] = new Map();
}
function lutCss(name, v) {
    const i = Math.max(0, Math.min(255, Math.round((v + 1) / 2 * 255))) * 3, l = LUT[name];
    return `rgb(${l[i]},${l[i + 1]},${l[i + 2]})`;
}
function colorToValue(name, r, g, b) {
    const key = (r << 16) | (g << 8) | b, memo = MEMO[name];
    let v = memo.get(key);
    if (v !== undefined) return v;
    const lut = LUT[name];
    let best = 0, bestD = Infinity;
    for (let i = 0; i < 256; i++) {
        const dr = lut[i * 3] - r, dg = lut[i * 3 + 1] - g, db = lut[i * 3 + 2] - b;
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) { bestD = d; best = i; }
    }
    v = -1 + 2 * best / 255;
    if (memo.size > 200000) memo.clear();
    memo.set(key, v);
    return v;
}

function insideAoi(latlng) {
    return insideCity(selectedCity, latlng);
}

function sampleAsset(asset, name, latlng) {
    if (!asset || !insideCity(asset.sel.city, latlng) || name === 'RGB') return null;
    const [w, s, e, n] = CITIES[asset.sel.city].bbox;
    const px = clamp(Math.floor((latlng.lng - w) / (e - w) * asset.width), 0, asset.width - 1);
    const py = clamp(Math.floor((n - latlng.lat) / (n - s) * asset.height), 0, asset.height - 1);
    const i = (py * asset.width + px) * 4;
    if (asset.imageData[i + 3] < 128) return null;
    return colorToValue(name, asset.imageData[i], asset.imageData[i + 1], asset.imageData[i + 2]);
}

map.createPane('aoiOutline');
map.getPane('aoiOutline').style.zIndex = 700;
map.getPane('aoiOutline').style.pointerEvents = 'none';
let aoiLayer = null;
function refreshAoiLayer() {
    if (aoiLayer) map.removeLayer(aoiLayer);
    const city = CITIES[selectedCity];
    const style = {
        pane: 'aoiOutline',
        color: '#2c3e50',
        weight: 2,
        fill: false,
        interactive: false
    };
    aoiLayer = city.geometry
        ? L.geoJSON({ type: 'Feature', properties: { name: city.name }, geometry: city.geometry }, { style, pane: 'aoiOutline', interactive: false })
        : L.rectangle(cityBounds(selectedCity), style);
    if ($('#aoi-toggle').checked) aoiLayer.addTo(map);
}
$('#aoi-toggle').addEventListener('change', e => {
    if (!aoiLayer) return;
    e.target.checked ? aoiLayer.addTo(map) : map.removeLayer(aoiLayer);
});

const coordsControl = L.control({ position: 'bottomleft' });
coordsControl.onAdd = function() {
    this._div = L.DomUtil.create('div', 'coords-info');
    this._div.innerHTML = 'Współrzędne: najedź na mapę';
    return this._div;
};
coordsControl.addTo(map);
map.on('mousemove', e => {
    coordsControl._div.innerHTML = `N: ${e.latlng.lat.toFixed(5)}°<br>E: ${e.latlng.lng.toFixed(5)}°`;
});

function updateLeftDateAvailability() {
    const enabled = !['base', 'off'].includes($('#compare').value);
    $('#left-year').disabled = !enabled;
    $('#left-month').disabled = !enabled;
    $('#left-date-row').classList.toggle('disabled', !enabled);
}

async function change() {
    const token = ++changeToken;
    const name = $('#layer').value;
    const cmp = $('#compare').value;
    updateLeftDateAvailability();

    $('#explain').textContent = INFO[name].text;
    $('#formula').textContent = INFO[name].formula;
    $('#legend').hidden = name === 'RGB';
    $('#stats-box').hidden = name === 'RGB';
    if (name !== 'RGB') $('#ramp').style.background = 'linear-gradient(to right,' + cfg.ramps[name].join(',') + ')';
    $('#probe-mark').hidden = true;
    document.querySelectorAll('#layer-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.key === name));
    probeControl._div.hidden = true;

    const rightSel = temporalSelection('right', name);
    const leftSel = !['base', 'off'].includes(cmp) ? temporalSelection('left', cmp) : null;

    setLoading(true);
    setState(`Pobieram ${humanLabel(rightSel)}${leftSel ? ' oraz ' + humanLabel(leftSel) : ''}…`);
    try {
        const [newRight, newLeft] = await Promise.all([
            getAsset(rightSel),
            leftSel ? getAsset(leftSel) : Promise.resolve(null)
        ]);
        if (token !== changeToken) return;

        rightAsset = newRight;
        leftAsset = newLeft;
        rightImg.src = rightAsset.url;
        if (leftAsset) leftImg.src = leftAsset.url;
        else leftImg.removeAttribute('src');

        const opacity = Number($('#opacity').value);
        rightImg.style.opacity = String(opacity);
        leftImg.style.opacity = String(opacity);

        leftLabel.hidden = cmp === 'off';
        rightLabel.hidden = cmp === 'off';
        leftLabel.textContent = cmp === 'base' ? 'Podkład' : (leftSel ? humanLabel(leftSel) : '');
        rightLabel.textContent = humanLabel(rightSel);

        syncAll();
        setState(`Warstwa ${humanLabel(rightSel)} wczytana z Copernicus Data Space${CITIES[selectedCity].exact ? ' • granica PRG' : ' • bbox awaryjny'}.`);
        renderSummary();
        scheduleStats();
        writeHash();
    } catch (err) {
        console.error(err);
        if (token === changeToken) setState(err.message || 'Błąd wczytywania danych.', true);
    } finally {
        if (token === changeToken) setLoading(false);
    }
}

const probeControl = L.control({ position: 'bottomleft' });
probeControl.onAdd = function () {
    this._div = L.DomUtil.create('div', 'coords-info');
    this._div.hidden = true;
    return this._div;
};
probeControl.addTo(map);

let hoverFrame = 0, hoverPending = null;
map.on('mousemove', e => {
    hoverPending = e.latlng;
    if (hoverFrame) return;
    hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0;
        const ll = hoverPending, name = $('#layer').value, box = probeControl._div, mark = $('#probe-mark');
        if (name === 'RGB' || !rightAsset) { box.hidden = true; return; }
        const v = sampleAsset(rightAsset, name, ll);
        box.hidden = false;
        if (v === null) {
            mark.hidden = true;
            box.innerHTML = `${name}: brak danych`;
        } else {
            mark.hidden = false;
            mark.style.left = ((v + 1) / 2 * 100) + '%';
            box.innerHTML = `${name} ≈ <b>${fmt(v)}</b>`;
        }
    });
});
map.on('mouseout', () => {
    probeControl._div.hidden = true;
    $('#probe-mark').hidden = true;
});

function selectionForClick(e) {
    const cmp = $('#compare').value;
    if (!['base', 'off'].includes(cmp)) {
        const split = mapContainer.clientWidth * swipeRatio;
        if (e.containerPoint.x < split) return temporalSelection('left', cmp);
    }
    return temporalSelection('right', $('#layer').value);
}
/*
map.on('click', async e => {
    if (!insideAoi(e.latlng)) return;
    const baseSel = selectionForClick(e);
    const popup = L.popup().setLatLng(e.latlng).setContent(
        `<div class="pt-title">N ${e.latlng.lat.toFixed(5)}° • E ${e.latlng.lng.toFixed(5)}°</div>` +
        `<div class="popup-loading">Pobieram wartości • ${MONTHS[baseSel.month - 1]} ${baseSel.year}…</div>`
    ).openOn(map);

    try {
        const assets = await Promise.all(INDICES.map(n => getAsset({ ...baseSel, index: n }).catch(() => null)));
        const vals = assets.map((a, i) => a ? sampleAsset(a, INDICES[i], e.latlng) : null);
        let html = `<div class="pt-title">N ${e.latlng.lat.toFixed(5)}° • E ${e.latlng.lng.toFixed(5)}° • ${MONTHS[baseSel.month - 1]} ${baseSel.year}</div>`;
        if (vals.every(v => v === null)) {
            html += 'Brak danych w tym punkcie.';
        } else {
            INDICES.forEach((n, i) => {
                const v = vals[i];
                if (v === null) {
                    html += `<div class="pt-row"><span></span><span>${n}</span><span class="pt-bar"></span><span class="pt-val">–</span></div>`;
                    return;
                }
                const col = lutCss(n, v);
                const left = Math.min(50, (v + 1) / 2 * 100), width = Math.abs(v) * 50;
                html += `<div class="pt-row"><span class="pt-sw" style="background:${col}"></span><span>${n}</span>` +
                        `<span class="pt-bar"><i style="left:${left}%;width:${width}%;background:${col}"></i></span>` +
                        `<span class="pt-val">${fmt(v)}</span></div>`;
            });
        }
        popup.setContent(html);
    } catch (err) {
        popup.setContent(`<div class="pt-title">N ${e.latlng.lat.toFixed(5)}° • E ${e.latlng.lng.toFixed(5)}°</div>Błąd odczytu: ${err.message}`);
    }
});
*/

const BINS = 40;
let statsTimer = 0, statsToken = 0;
function scheduleStats() { clearTimeout(statsTimer); statsTimer = setTimeout(updateStats, 250); }

function pixelRegion(asset, bounds) {
    const [w, s, e, n] = CITIES[asset.sel.city].bbox;
    const west = clamp(bounds.getWest(), w, e);
    const east = clamp(bounds.getEast(), w, e);
    const south = clamp(bounds.getSouth(), s, n);
    const north = clamp(bounds.getNorth(), s, n);
    if (west >= east || south >= north) return null;
    return {
        x0: clamp(Math.floor((west - w) / (e - w) * asset.width), 0, asset.width - 1),
        x1: clamp(Math.ceil((east - w) / (e - w) * asset.width), 1, asset.width),
        y0: clamp(Math.floor((n - north) / (n - s) * asset.height), 0, asset.height - 1),
        y1: clamp(Math.ceil((n - south) / (n - s) * asset.height), 1, asset.height)
    };
}

function assetPixelLatLng(asset, x, y) {
    const [w, s, e, n] = CITIES[asset.sel.city].bbox;
    return {
        lng: w + ((x + 0.5) / asset.width) * (e - w),
        lat: n - ((y + 0.5) / asset.height) * (n - s)
    };
}

function computeStats(asset, name, region) {
    const bins = new Uint32Array(BINS);
    if (!asset || !region || name === 'RGB') return { bins, count: 0, sum: 0, above: 0, median: 0 };
    const area = Math.max(1, (region.x1 - region.x0) * (region.y1 - region.y0));
    const step = Math.max(1, Math.floor(Math.sqrt(area / 45000)));
    let count = 0, sum = 0, above = 0;
    const thr = INFO[name].thr;
    for (let y = region.y0; y < region.y1; y += step) {
        for (let x = region.x0; x < region.x1; x += step) {
            if (CITIES[asset.sel.city].geometry) {
                const ll = assetPixelLatLng(asset, x, y);
                if (!insideCity(asset.sel.city, ll)) continue;
            }
            const i = (y * asset.width + x) * 4;
            if (asset.imageData[i + 3] < 128) continue;
            const val = colorToValue(name, asset.imageData[i], asset.imageData[i + 1], asset.imageData[i + 2]);
            bins[Math.min(BINS - 1, Math.floor((val + 1) / 2 * BINS))]++;
            count++; sum += val;
            if (val > thr) above++;
        }
    }
    let acc = 0, median = 0;
    for (let i = 0; i < BINS; i++) {
        acc += bins[i];
        if (acc >= count / 2) { median = -1 + (i + 0.5) * 2 / BINS; break; }
    }
    return { bins, count, sum, above, median };
}

function updateStats() {
    const name = $('#layer').value;
    if (name === 'RGB' || !rightAsset || !$('#hist')) return;
    const token = ++statsToken;
    const region = pixelRegion(rightAsset, map.getBounds());
    const result = computeStats(rightAsset, name, region);
    if (token !== statsToken) return;
    drawHist(name, result.bins, result.count);
    const dl = $('#stats');
    if (!result.count) {
        dl.innerHTML = '<dt>Brak danych w widoku</dt><dd></dd>';
        return;
    }
    dl.innerHTML =
        `<dt>Średnia</dt><dd>${fmt(result.sum / result.count)}</dd>` +
        `<dt>Mediana</dt><dd>${fmt(result.median)}</dd>` +
        `<dt>Udział: ${INFO[name].thrLabel}</dt><dd>${(result.above / result.count * 100).toFixed(1).replace('.', ',')}%</dd>` +
        `<dt>Próbek</dt><dd>${result.count.toLocaleString('pl-PL')}</dd>`;
}

function drawHist(name, bins, count) {
    const c = $('#hist'), ctx = c.getContext('2d');
    const W = c.width, H = c.height, pad = 10, base = H - 22;
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(1, ...bins), bw = (W - 2 * pad) / BINS;
    for (let i = 0; i < BINS; i++) {
        const h = count ? bins[i] / max * (base - pad) : 0;
        ctx.fillStyle = lutCss(name, -1 + (i + 0.5) * 2 / BINS);
        ctx.fillRect(pad + i * bw + 1, base - h, bw - 2, Math.max(h, 1));
    }
    ctx.fillStyle = '#8fa3b8';
    ctx.font = '18px Segoe UI, sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';   ctx.fillText('−1', pad, H - 1);
    ctx.textAlign = 'center'; ctx.fillText('0', W / 2, H - 1);
    ctx.textAlign = 'right';  ctx.fillText('1', W - pad, H - 1);
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.fillRect(W / 2, pad, 1, base - pad);
}

function renderSummary() {
    const dl = $('#summary');
    const name = $('#layer').value;
    if (!dl || name === 'RGB' || !rightAsset) { if (dl) dl.hidden = true; return; }
    const region = { x0: 0, y0: 0, x1: rightAsset.width, y1: rightAsset.height };
    const r = computeStats(rightAsset, name, region);
    dl.hidden = !r.count;
    if (!r.count) return;
    const wholeLabel = CITIES[rightAsset.sel.city].exact ? 'całe miasto' : 'cały bbox';
    dl.innerHTML =
        `<dt>Średnia (${wholeLabel})</dt><dd>${fmt(r.sum / r.count)}</dd>` +
        `<dt>Mediana (${wholeLabel})</dt><dd>${fmt(r.median)}</dd>` +
        `<dt>${INFO[name].thrLabel} (${wholeLabel})</dt><dd>${(r.above / r.count * 100).toFixed(1).replace('.', ',')}%</dd>`;
}

map.on('moveend', () => { writeHash(); scheduleStats(); });

function renderPlaces() {
    const parent = $('#places');
    parent.innerHTML = '';
    for (const p of CITIES[selectedCity].places) {
        const b = document.createElement('button');
        b.className = 'place';
        b.type = 'button';
        b.innerHTML = `${p.name}<small>${p.hint}</small>`;
        b.addEventListener('click', () => { setLayer(p.layer); map.flyTo(p.ll, p.z, { duration: 1.2 }); });
        parent.appendChild(b);
    }
}

async function setCity(key, { fit = true, reload = true } = {}) {
    if (!CITIES[key]) return;
    selectedCity = key;
    $('#city-select').value = key;
    $('#city').textContent = CITIES[key].name;
    cfg.bounds = cityBounds(key);
    refreshAoiLayer();
    renderPlaces();
    if (fit) map.fitBounds(cfg.bounds);
    syncAll();
    if (reload) await change();
}

function chip(parent, key, onClick) {
    if (!parent) return;
    const b = document.createElement('button');
    b.className = 'chip';
    b.type = 'button';
    b.dataset.key = key;
    b.textContent = key;
    b.addEventListener('click', onClick);
    parent.appendChild(b);
}
function setLayer(name) { $('#layer').value = name; change(); }
LAYERS.forEach(n => chip($('#layer-chips'), n, () => setLayer(n)));
Object.keys(BASEMAPS).forEach(k => chip($('#basemaps'), k, () => setBasemap(k)));

$('#city-select').addEventListener('change', e => setCity(e.target.value));
$('#layer').addEventListener('change', change);
$('#compare').addEventListener('change', change);
$('#right-year').addEventListener('change', () => { populateMonths($('#right-month'), $('#right-year')); change(); });
$('#right-month').addEventListener('change', change);
$('#left-year').addEventListener('change', () => { populateMonths($('#left-month'), $('#left-year')); if (!['base','off'].includes($('#compare').value)) change(); });
$('#left-month').addEventListener('change', () => { if (!['base','off'].includes($('#compare').value)) change(); });

$('#opacity').addEventListener('input', e => {
    const o = Number(e.target.value);
    rightImg.style.opacity = String(o);
    leftImg.style.opacity = String(o);
    $('#opacity-out').textContent = Math.round(o * 100) + '%';
});

$('#reset').addEventListener('click', () => map.fitBounds(cfg.bounds));

function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
}
$('#fullscreen').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => setTimeout(() => { map.invalidateSize(); syncAll(); }, 150));

$('#share').addEventListener('click', async () => {
    const btn = $('#share');
    try { await navigator.clipboard.writeText(location.href); btn.textContent = 'Skopiowano ✓'; }
    catch (e) { btn.textContent = 'Skopiuj z paska adresu'; }
    setTimeout(() => btn.textContent = 'Kopiuj link', 1800);
});

document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    const n = Number(e.key);
    if (n >= 1 && n <= LAYERS.length) setLayer(LAYERS[n - 1]);
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
});

let ready = false;
function writeHash() {
    if (!ready) return;
    const c = map.getCenter();
    const p = [
        'v2', selectedCity, $('#layer').value,
        $('#right-year').value, $('#right-month').value,
        $('#compare').value, $('#left-year').value, $('#left-month').value,
        map.getZoom(), c.lat.toFixed(4), c.lng.toFixed(4)
    ];
    history.replaceState(null, '', '#' + p.join('/'));
}

function setSelectValue(id, value) {
    const el = $(id);
    if ([...el.options].some(o => o.value === String(value))) el.value = String(value);
}

function readHash() {
    const p = location.hash.slice(1).split('/');
    if (p[0] === 'v2' && p.length === 11 && CITIES[p[1]] && LAYERS.includes(p[2])) {
        selectedCity = p[1];
        $('#city-select').value = selectedCity;
        $('#city').textContent = CITIES[selectedCity].name;
        cfg.bounds = cityBounds(selectedCity);
        $('#layer').value = p[2];
        setSelectValue('#right-year', p[3]);
        populateMonths($('#right-month'), $('#right-year'), Number(p[4]));
        setSelectValue('#right-month', p[4]);
        if ([...$('#compare').options].some(o => o.value === p[5])) $('#compare').value = p[5];
        setSelectValue('#left-year', p[6]);
        populateMonths($('#left-month'), $('#left-year'), Number(p[7]));
        setSelectValue('#left-month', p[7]);
        const z = Number(p[8]), lat = Number(p[9]), lng = Number(p[10]);
        if ([z, lat, lng].every(Number.isFinite)) map.setView([lat, lng], z);
        return true;
    }

    if (p.length === 4 && LAYERS.includes(p[0])) {
        $('#layer').value = p[0];
        const z = Number(p[1]), lat = Number(p[2]), lng = Number(p[3]);
        if ([z, lat, lng].every(Number.isFinite)) map.setView([lat, lng], z);
        return true;
    }
    return false;
}

const restoredView = readHash();
setBasemap('OSM');
updateLeftDateAvailability();

(async function initialize() {
    await loadOfficialBoundaries();
    cfg.bounds = cityBounds(selectedCity);
    refreshAoiLayer();
    renderPlaces();
    if (!restoredView) map.fitBounds(cfg.bounds);
    ready = true;
    syncAll();
    await change();
})();
