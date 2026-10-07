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

const INFO = {
    NDVI: {
        formula: 'NDVI = (B08 − B04) / (B08 + B04)',
        thr: 0.5,
        thrLabel: 'piksele z NDVI > 0,5',
        text: 'Wyższe wartości często odpowiadają roślinności; interpretacja zależy od pokrycia terenu i daty.'
    },
    NDBI: {
        formula: 'NDBI = (B11 − B08) / (B11 + B08)',
        thr: 0,
        thrLabel: 'piksele z NDBI > 0',
        text: 'Dodatni wynik może wskazywać zabudowę, ale też odsłoniętą glebę – porównaj z RGB i NDVI.'
    },
    MNDWI: {
        formula: 'MNDWI = (B03 − B11) / (B03 + B11)',
        thr: 0,
        thrLabel: 'piksele z MNDWI > 0',
        text: 'Wskaźnik wspierający rozpoznawanie wód powierzchniowych w terenach zurbanizowanych.'
    },
    NDWI: {
        formula: 'NDWI = (B03 − B08) / (B03 + B08)',
        thr: 0,
        thrLabel: 'piksele z NDWI > 0',
        text: 'Wskaźnik służący do detekcji zbiorników wodnych.'
    },
    NDMI: {
        formula: 'NDMI = (B08 − B11) / (B08 + B11)',
        thr: 0.2,
        thrLabel: 'piksele z NDMI > 0,2',
        text: 'Wskaźnik obrazujący poziom wilgotności roślinności (stres wodny).'
    },
    RGB: {
        formula: '',
        text: 'Kompozycja barwna. Kontrast wyrównany, kolory służą do ogólnej interpretacji obrazu.'
    }
};

const LAYERS = Object.keys(INFO);
const INDICES = LAYERS.filter(n => n !== 'RGB');

const BASEMAPS = {
    'OSM': {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    'Satelita': {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr: 'Tiles © Esri, Maxar, Earthstar Geographics'
    },
    'Brak': null
};

const KRAKOW_PLACES = [
    { name: 'Stare Miasto', hint: 'zabudowa • NDBI', ll: [50.0617, 19.9373], z: 14, layer: 'NDBI' },
    { name: 'Kombinat N. Huta', hint: 'przemysł • NDBI', ll: [50.0780, 20.1000], z: 13, layer: 'NDBI' },
    { name: 'Las Wolski', hint: 'las • NDVI', ll: [50.0550, 19.8500], z: 14, layer: 'NDVI' },
    { name: 'Zalew Kryspinów', hint: 'woda • MNDWI', ll: [50.0470, 19.7900], z: 14, layer: 'MNDWI' },
    { name: 'Zalew Bagry', hint: 'woda • MNDWI', ll: [50.0360, 19.9900], z: 14, layer: 'MNDWI' },
    { name: 'Dolina Prądnika', hint: 'roślinność • NDVI', ll: [50.2100, 19.8300], z: 13, layer: 'NDVI' }
];

const TARNOW_PLACES = [
    {
        name: 'Rynek',
        hint: 'zabudowa • NDBI',
        ll: [50.012414, 20.987900],
        z: 15,
        layer: 'NDBI'
    },
    {
        name: 'Grupa Azoty',
        hint: 'przemysł • NDBI',
        ll: [50.022500, 20.920556],
        z: 14,
        layer: 'NDBI'
    },
    {
        name: 'Park Strzelecki',
        hint: 'zieleń • NDVI',
        ll: [50.019268, 20.985443],
        z: 15,
        layer: 'NDVI'
    },
    {
        name: 'Park Piaskówka',
        hint: 'zieleń • NDVI',
        ll: [50.031530, 20.979090],
        z: 15,
        layer: 'NDVI'
    },
    {
        name: 'Zakłady Mechaniczne',
        hint: 'przemysł • NDBI',
        ll: [50.007750, 20.957361],
        z: 15,
        layer: 'NDBI'
    },
    {
        name: 'Góra św. Marcina',
        hint: 'obszary leśne • NDMI',
        ll: [49.993056, 21.000278],
        z: 14,
        layer: 'NDMI'
    }
];


const AREAS = {
    krakow: {
        name: 'Kraków',
        tiles: 'tiles',
        tileSuffix: '',
        aoi: 'aoi.geojson',
        summary: 'summary.json',
        bounds: cfg.bounds,
        places: KRAKOW_PLACES,
        fallbackScene: null
    },

    tarnow: {
    name: 'Tarnów',
    tiles: 'tiles_tarnow',
    tileSuffix: '_big',
    aoi: 'aoi_tarnow.geojson',
    summary: null,
    bounds: null,
    places: TARNOW_PLACES,
    fallbackScene: {
        product: 'Sentinel-2 L2A',
        date: '2026-08-16'
    }
}
};

let areaKey = 'krakow';
let currentArea = AREAS[areaKey];
let currentBounds = L.latLngBounds(currentArea.bounds);

const $ = s => document.querySelector(s);

const fmt = v =>
    v.toFixed(2)
        .replace('.', ',')
        .replace('-', '−');

const tileUrl = (name, z, x, y) =>
    `${currentArea.tiles}/${name}${currentArea.tileSuffix}/${z}/${x}/${y}.png`;

const map = L.map('map', {
    minZoom: cfg.minzoom,
    maxZoom: 17
}).fitBounds(currentBounds);

L.control.scale({
    imperial: false,
    position: 'bottomright'
}).addTo(map);


// ============================================================
// PODKŁAD
// ============================================================

const osmLayer = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19,
        attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
).addTo(map);

const emptyLayer = L.tileLayer(
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
).addTo(map);

const text = Object.fromEntries(
    LAYERS.map(name => [name, INFO[name].text])
);

let overlay;
let sideBySideControl;


// ============================================================
// ZMIANA WARSTWY
// ============================================================

function change() {

    const name =
        document.querySelector('#layer').value;

    if (overlay) {
        map.removeLayer(overlay);
    }

    if (sideBySideControl) {
        map.removeControl(sideBySideControl);
    }

    overlay = L.tileLayer(
        tileUrl(
            name,
            '{z}',
            '{x}',
            '{y}'
        ),
        {
            pane: 'aoiPane',
            tileSize: 256,
            tms: false,
            minZoom: cfg.minzoom,
            maxNativeZoom: cfg.maxzoom,
            maxZoom: 17,
            bounds: currentBounds,
            noWrap: true,
            opacity:
                Number(
                    document.querySelector('#opacity').value
                ),
            attribution:
                'Własne opracowanie'
        }
    ).addTo(map);

    sideBySideControl =
        L.control.sideBySide(
            emptyLayer,
            overlay
        ).addTo(map);

    const sbsRange =
        document.querySelector(
            '.leaflet-sbs-range'
        );

    if (sbsRange) {

        sbsRange.addEventListener(
            'mousedown',
            () => map.dragging.disable()
        );

        sbsRange.addEventListener(
            'touchstart',
            () => map.dragging.disable(),
            { passive: true }
        );

        document.addEventListener(
            'mouseup',
            () => map.dragging.enable()
        );

        document.addEventListener(
            'touchend',
            () => map.dragging.enable()
        );
    }

    document.querySelector(
        '#explain'
    ).textContent =
        text[name];

    document.querySelector(
        '#legend'
    ).hidden =
        name === 'RGB';

    if (name !== 'RGB') {

        document.querySelector(
            '#ramp'
        ).style.background =
            'linear-gradient(to right,' +
            cfg.ramps[name].join(',') +
            ')';
    }

    overlay.on(
        'load',
        () =>
            document.querySelector(
                '#state'
            ).textContent =
                'Warstwa ' +
                name +
                ' wczytana.'
    );

    overlay.on(
        'tileerror',
        () =>
            document.querySelector(
                '#state'
            ).textContent =
                'Błąd wczytywania kafelków.'
    );

    afterChange(name);
}


document.querySelector(
    '#layer'
).addEventListener(
    'change',
    change
);

document.querySelector(
    '#opacity'
).addEventListener(
    'input',
    e => {
        if (overlay) {
            overlay.setOpacity(
                Number(
                    e.target.value
                )
            );
        }
    }
);

document.querySelector(
    '#reset'
).addEventListener(
    'click',
    () =>
        map.fitBounds(
            currentBounds
        )
);


// ============================================================
// WSPÓŁRZĘDNE
// ============================================================

const coordsControl =
    L.control({
        position: 'bottomleft'
    });

coordsControl.onAdd =
    function (map) {

        this._div =
            L.DomUtil.create(
                'div',
                'coords-info'
            );

        this._div.style.backgroundColor =
            'rgba(255, 255, 255, 0.95)';

        this._div.style.padding =
            '6px 12px';

        this._div.style.borderRadius =
            '6px';

        this._div.style.fontSize =
            '12px';

        this._div.style.boxShadow =
            '0 2px 6px rgba(0,0,0,0.2)';

        this._div.innerHTML =
            'Współrzędne: najedź na mapę';

        return this._div;
    };

coordsControl.addTo(map);

map.on(
    'mousemove',
    function (e) {

        coordsControl._div.innerHTML =
            `N: ${e.latlng.lat.toFixed(5)}°<br>` +
            `E: ${e.latlng.lng.toFixed(5)}°`;
    }
);

coordsControl._div.removeAttribute(
    'style'
);


// ============================================================
// PODKŁADY
// ============================================================

osmLayer.setZIndex(0);

let baseLayer =
    osmLayer;

function setBasemap(key) {

    if (baseLayer) {
        map.removeLayer(
            baseLayer
        );
    }

    const b =
        BASEMAPS[key];

    if (key === 'OSM') {

        baseLayer =
            osmLayer.addTo(map);

    } else {

        baseLayer =
            b
                ? L.tileLayer(
                    b.url,
                    {
                        maxZoom: 19,
                        zIndex: 0,
                        attribution: b.attr
                    }
                ).addTo(map)
                : null;
    }

    document
        .querySelectorAll(
            '#basemaps .chip'
        )
        .forEach(
            c =>
                c.classList.toggle(
                    'active',
                    c.dataset.key === key
                )
        );
}


// ============================================================
// PRZYCINANIE DO AOI
// ============================================================

map.createPane(
    'aoiPane'
).style.zIndex =
    250;

let aoiRings = null;

function clipPath(toPoint) {

    return (
        'path(evenodd, "' +

        aoiRings
            .map(
                r =>
                    'M' +
                    r.map(
                        c => {

                            const p =
                                toPoint(
                                    L.latLng(
                                        c[1],
                                        c[0]
                                    )
                                );

                            return (
                                p.x.toFixed(1) +
                                ' ' +
                                p.y.toFixed(1)
                            );
                        }
                    ).join('L') +
                    'Z'
            )
            .join(' ') +

        '")'
    );
}


function updateClip() {

    if (aoiRings) {

        map.getPane(
            'aoiPane'
        ).style.clipPath =
            clipPath(
                ll =>
                    map.latLngToLayerPoint(
                        ll
                    )
            );
    }
}


function insideAoi(latlng) {

    if (!aoiRings) {
        return true;
    }

    let inside =
        false;

    for (const r of aoiRings) {

        for (
            let i = 0,
                k = r.length - 1;
            i < r.length;
            k = i++
        ) {

            const xi =
                r[i][0];

            const yi =
                r[i][1];

            const xk =
                r[k][0];

            const yk =
                r[k][1];

            if (
                (yi > latlng.lat) !==
                    (yk > latlng.lat) &&

                latlng.lng <
                    (xk - xi) *
                    (latlng.lat - yi) /
                    (yk - yi) +
                    xi
            ) {
                inside =
                    !inside;
            }
        }
    }

    return inside;
}


map.on(
    'zoomend viewreset moveend',
    updateClip
);

map.on(
    'zoomanim',
    e => {

        if (aoiRings) {

            map.getPane(
                'aoiPane'
            ).style.clipPath =
                clipPath(
                    ll =>
                        map._latLngToNewLayerPoint(
                            ll,
                            e.zoom,
                            e.center
                        )
                );
        }
    }
);


// ============================================================
// PORÓWNANIE WARSTW
// ============================================================

let leftIdx =
    null;

function blockDragOnSlider() {

    const range =
        map
            .getContainer()
            .querySelector(
                '.leaflet-sbs-range'
            );

    if (!range) {
        return;
    }

    range.addEventListener(
        'mousedown',
        () =>
            map.dragging.disable()
    );

    range.addEventListener(
        'touchstart',
        () =>
            map.dragging.disable(),
        { passive: true }
    );
}


function sideLabel(id, txt) {

    let el =
        document.getElementById(
            id
        );

    if (!el) {

        el =
            L.DomUtil.create(
                'div',
                'side-label',
                map.getContainer()
            );

        el.id =
            id;
    }

    el.hidden =
        !txt;

    el.textContent =
        txt || '';
}


function afterChange(name) {

    if (leftIdx) {

        map.removeLayer(
            leftIdx
        );

        leftIdx =
            null;
    }

    const cmpSel =
        $('#compare');

    let cmp =
        cmpSel
            ? cmpSel.value
            : 'base';

    if (cmp === name) {

        cmp =
            'base';

        cmpSel.value =
            'base';
    }

    if (cmp === 'off') {

        map.removeControl(
            sideBySideControl
        );

        sideBySideControl =
            null;

        const c =
            overlay.getContainer();

        if (c) {
            c.style.clip =
                '';
        }

    } else if (
        cmp !== 'base'
    ) {

        leftIdx =
            L.tileLayer(
                tileUrl(
                    cmp,
                    '{z}',
                    '{x}',
                    '{y}'
                ),
                Object.assign(
                    {},
                    overlay.options
                )
            ).addTo(map);

        map.removeControl(
            sideBySideControl
        );

        sideBySideControl =
            L.control
                .sideBySide(
                    leftIdx,
                    overlay
                )
                .addTo(map);

        blockDragOnSlider();
    }

    sideLabel(
        'label-left',
        cmp === 'off'
            ? ''
            : (
                cmp === 'base'
                    ? 'Podkład'
                    : cmp
            )
    );

    sideLabel(
        'label-right',
        cmp === 'off'
            ? ''
            : name
    );

    const formula =
        $('#formula');

    if (formula) {

        formula.textContent =
            INFO[name].formula;
    }

    const statsBox =
        $('#stats-box');

    if (statsBox) {

        statsBox.hidden =
            name === 'RGB';
    }

    const mark =
        $('#probe-mark');

    if (mark) {
        mark.hidden =
            true;
    }

    document
        .querySelectorAll(
            '#layer-chips .chip'
        )
        .forEach(
            c =>
                c.classList.toggle(
                    'active',
                    c.dataset.key === name
                )
        );

    probeControl._div.hidden =
        true;

    renderSummary();
    scheduleStats();
    writeHash();
}


// ============================================================
// KOLOR → WARTOŚĆ
// ============================================================

const LUT = {};
const MEMO = {};

for (
    const name
    of INDICES
) {

    const stops =
        cfg.ramps[name]
            .map(
                h => {

                    const n =
                        parseInt(
                            h.slice(1),
                            16
                        );

                    return [
                        n >> 16,
                        (n >> 8) & 255,
                        n & 255
                    ];
                }
            );

    const lut =
        new Uint8Array(
            256 * 3
        );

    for (
        let i = 0;
        i < 256;
        i++
    ) {

        const t =
            i / 255 *
            (stops.length - 1);

        const a =
            Math.floor(t);

        const b =
            Math.min(
                a + 1,
                stops.length - 1
            );

        const f =
            t - a;

        for (
            let k = 0;
            k < 3;
            k++
        ) {

            lut[
                i * 3 + k
            ] =
                Math.round(
                    stops[a][k] +
                    (
                        stops[b][k] -
                        stops[a][k]
                    ) *
                    f
                );
        }
    }

    LUT[name] =
        lut;

    MEMO[name] =
        new Map();
}


function lutCss(
    name,
    v
) {

    const i =
        Math.max(
            0,
            Math.min(
                255,
                Math.round(
                    (v + 1) /
                    2 *
                    255
                )
            )
        ) * 3;

    const l =
        LUT[name];

    return (
        `rgb(${l[i]},` +
        `${l[i + 1]},` +
        `${l[i + 2]})`
    );
}


function colorToValue(
    name,
    r,
    g,
    b
) {

    const key =
        (r << 16) |
        (g << 8) |
        b;

    const memo =
        MEMO[name];

    let v =
        memo.get(key);

    if (
        v !== undefined
    ) {
        return v;
    }

    const lut =
        LUT[name];

    let best =
        0;

    let bestD =
        Infinity;

    for (
        let i = 0;
        i < 256;
        i++
    ) {

        const dr =
            lut[i * 3] -
            r;

        const dg =
            lut[i * 3 + 1] -
            g;

        const db =
            lut[i * 3 + 2] -
            b;

        const d =
            dr * dr +
            dg * dg +
            db * db;

        if (d < bestD) {

            bestD =
                d;

            best =
                i;
        }
    }

    v =
        -1 +
        2 *
        best /
        255;

    if (
        memo.size >
        200000
    ) {
        memo.clear();
    }

    memo.set(
        key,
        v
    );

    return v;
}


// ============================================================
// KAFELKI
// ============================================================

const tileCache =
    new Map();

let readBlocked =
    false;

function loadTile(
    name,
    z,
    x,
    y
) {

    const key =
        `${areaKey}/${name}/${z}/${x}/${y}`;

    if (
        tileCache.has(
            key
        )
    ) {
        return tileCache.get(
            key
        );
    }

    const p =
        new Promise(
            resolve => {

                const img =
                    new Image();

                img.onload =
                    () => {

                        try {

                            const c =
                                document.createElement(
                                    'canvas'
                                );

                            c.width =
                                256;

                            c.height =
                                256;

                            const ctx =
                                c.getContext(
                                    '2d',
                                    {
                                        willReadFrequently:
                                            true
                                    }
                                );

                            ctx.drawImage(
                                img,
                                0,
                                0,
                                256,
                                256
                            );

                            resolve(
                                ctx.getImageData(
                                    0,
                                    0,
                                    256,
                                    256
                                ).data
                            );

                        } catch (e) {

                            readBlocked =
                                true;

                            resolve(null);
                        }
                    };

                img.onerror =
                    () =>
                        resolve(
                            null
                        );

                img.src =
                    tileUrl(
                        name,
                        z,
                        x,
                        y
                    );
            }
        );

    tileCache.set(
        key,
        p
    );

    if (
        tileCache.size >
        300
    ) {

        tileCache.delete(
            tileCache
                .keys()
                .next()
                .value
        );
    }

    return p;
}


async function sample(
    name,
    latlng
) {

    if (
        !insideAoi(
            latlng
        )
    ) {
        return null;
    }

    const z =
        cfg.maxzoom;

    const p =
        map.project(
            latlng,
            z
        );

    const tx =
        Math.floor(
            p.x / 256
        );

    const ty =
        Math.floor(
            p.y / 256
        );

    const d =
        await loadTile(
            name,
            z,
            tx,
            ty
        );

    if (!d) {
        return null;
    }

    const i =
        (
            (
                Math.floor(
                    p.y
                ) -
                ty * 256
            ) *
            256 +
            (
                Math.floor(
                    p.x
                ) -
                tx * 256
            )
        ) *
        4;

    if (
        d[i + 3] <
        128
    ) {
        return null;
    }

    return colorToValue(
        name,
        d[i],
        d[i + 1],
        d[i + 2]
    );
}


// ============================================================
// ODCZYT POD KURSOREM
// ============================================================

const probeControl =
    L.control({
        position:
            'bottomleft'
    });

probeControl.onAdd =
    function () {

        this._div =
            L.DomUtil.create(
                'div',
                'coords-info'
            );

        this._div.hidden =
            true;

        return this._div;
    };

probeControl.addTo(
    map
);

let hoverFrame =
    0;

let hoverPending =
    null;

map.on(
    'mousemove',
    e => {

        hoverPending =
            e.latlng;

        if (hoverFrame) {
            return;
        }

        hoverFrame =
            requestAnimationFrame(
                async () => {

                    hoverFrame =
                        0;

                    const ll =
                        hoverPending;

                    const name =
                        $('#layer').value;

                    const box =
                        probeControl._div;

                    const mark =
                        $('#probe-mark');

                    if (
                        name === 'RGB'
                    ) {

                        box.hidden =
                            true;

                        return;
                    }

                    const v =
                        await sample(
                            name,
                            ll
                        );

                    if (
                        ll !==
                        hoverPending
                    ) {
                        return;
                    }

                    box.hidden =
                        false;

                    if (
                        v === null
                    ) {

                        if (mark) {
                            mark.hidden =
                                true;
                        }

                        box.innerHTML =
                            readBlocked
                                ? 'Odczyt wymaga serwera http'
                                : `${name}: brak danych`;

                    } else {

                        if (mark) {

                            mark.hidden =
                                false;

                            mark.style.left =
                                (
                                    (
                                        v + 1
                                    ) /
                                    2 *
                                    100
                                ) +
                                '%';
                        }

                        box.innerHTML =
                            `${name} ≈ <b>${fmt(v)}</b>`;
                    }
                }
            );
    }
);


map.on(
    'mouseout',
    () => {

        probeControl._div.hidden =
            true;

        const mark =
            $('#probe-mark');

        if (mark) {

            mark.hidden =
                true;
        }
    }
);


// ============================================================
// KLIKNIĘCIE NA MAPĘ
// ============================================================

map.on(
    'click',
    async e => {

        const vals =
            await Promise.all(
                INDICES.map(
                    n =>
                        sample(
                            n,
                            e.latlng
                        )
                )
            );

        let html =
            `<div class="pt-title">` +
            `N ${e.latlng.lat.toFixed(5)}° • ` +
            `E ${e.latlng.lng.toFixed(5)}°` +
            `</div>`;

        if (
            vals.every(
                v =>
                    v === null
            )
        ) {

            html +=
                readBlocked
                    ? 'Odczyt pikseli jest zablokowany – uruchom stronę przez serwer http.'
                    : 'Brak danych w tym punkcie.';

        } else {

            INDICES.forEach(
                (n, i) => {

                    const v =
                        vals[i];

                    if (
                        v === null
                    ) {

                        html +=
                            `<div class="pt-row">` +
                            `<span></span>` +
                            `<span>${n}</span>` +
                            `<span class="pt-bar"></span>` +
                            `<span class="pt-val">–</span>` +
                            `</div>`;

                        return;
                    }

                    const col =
                        lutCss(
                            n,
                            v
                        );

                    const left =
                        Math.min(
                            50,
                            (
                                v + 1
                            ) /
                            2 *
                            100
                        );

                    const width =
                        Math.abs(
                            v
                        ) *
                        50;

                    html +=
                        `<div class="pt-row">` +
                        `<span class="pt-sw" style="background:${col}"></span>` +
                        `<span>${n}</span>` +
                        `<span class="pt-bar">` +
                        `<i style="left:${left}%;width:${width}%;background:${col}"></i>` +
                        `</span>` +
                        `<span class="pt-val">${fmt(v)}</span>` +
                        `</div>`;
                }
            );
        }

        L.popup()
            .setLatLng(
                e.latlng
            )
            .setContent(
                html
            )
            .openOn(
                map
            );
    }
);


// ============================================================
// STATYSTYKI WIDOKU
// ============================================================

const BINS =
    40;

let statsTimer =
    0;

let statsToken =
    0;

function scheduleStats() {

    clearTimeout(
        statsTimer
    );

    statsTimer =
        setTimeout(
            updateStats,
            250
        );
}


async function updateStats() {

    const name =
        $('#layer').value;

    if (
        name === 'RGB' ||
        !$('#hist')
    ) {
        return;
    }

    const token =
        ++statsToken;

    const v =
        map.getBounds();

    const a =
        currentBounds;

    const bins =
        new Uint32Array(
            BINS
        );

    let count =
        0;

    let sum =
        0;

    let above =
        0;

    if (
        v.intersects(a)
    ) {

        const north =
            Math.min(
                v.getNorth(),
                a.getNorth()
            );

        const south =
            Math.max(
                v.getSouth(),
                a.getSouth()
            );

        const west =
            Math.max(
                v.getWest(),
                a.getWest()
            );

        const east =
            Math.min(
                v.getEast(),
                a.getEast()
            );

        let z =
            Math.max(
                cfg.minzoom,
                Math.min(
                    cfg.maxzoom,
                    Math.floor(
                        map.getZoom()
                    )
                )
            );

        let nw;
        let se;
        let x0;
        let x1;
        let y0;
        let y1;

        for (;;) {

            nw =
                map.project(
                    [north, west],
                    z
                );

            se =
                map.project(
                    [south, east],
                    z
                );

            x0 =
                Math.floor(
                    nw.x /
                    256
                );

            x1 =
                Math.floor(
                    se.x /
                    256
                );

            y0 =
                Math.floor(
                    nw.y /
                    256
                );

            y1 =
                Math.floor(
                    se.y /
                    256
                );

            if (
                (
                    x1 -
                    x0 +
                    1
                ) *
                (
                    y1 -
                    y0 +
                    1
                ) <=
                48 ||
                z <=
                cfg.minzoom
            ) {
                break;
            }

            z--;
        }

        const jobs =
            [];

        for (
            let x = x0;
            x <= x1;
            x++
        ) {

            for (
                let y = y0;
                y <= y1;
                y++
            ) {

                jobs.push(
                    loadTile(
                        name,
                        z,
                        x,
                        y
                    ).then(
                        d => ({
                            x,
                            y,
                            d
                        })
                    )
                );
            }
        }

        const tiles =
            await Promise.all(
                jobs
            );

        if (
            token !==
            statsToken
        ) {
            return;
        }

        const thr =
            INFO[name].thr;

        const STEP =
            4;

        let mask =
            null;

        let mw =
            0;

        if (aoiRings) {

            const cv =
                document.createElement(
                    'canvas'
                );

            mw =
                cv.width =
                    (
                        x1 -
                        x0 +
                        1
                    ) *
                    256 /
                    STEP;

            cv.height =
                (
                    y1 -
                    y0 +
                    1
                ) *
                256 /
                STEP;

            const mc =
                cv.getContext(
                    '2d'
                );

            mc.beginPath();

            for (
                const r
                of aoiRings
            ) {

                r.forEach(
                    (c, i) => {

                        const p =
                            map.project(
                                [
                                    c[1],
                                    c[0]
                                ],
                                z
                            );

                        mc[
                            i
                                ? 'lineTo'
                                : 'moveTo'
                        ](
                            (
                                p.x -
                                x0 *
                                256
                            ) /
                            STEP,
                            (
                                p.y -
                                y0 *
                                256
                            ) /
                            STEP
                        );
                    }
                );

                mc.closePath();
            }

            mc.fill(
                'evenodd'
            );

            mask =
                mc.getImageData(
                    0,
                    0,
                    cv.width,
                    cv.height
                ).data;
        }

        for (
            const t
            of tiles
        ) {

            if (!t.d) {
                continue;
            }

            for (
                let py = 0;
                py < 256;
                py += STEP
            ) {

                const gy =
                    t.y *
                    256 +
                    py;

                if (
                    gy < nw.y ||
                    gy > se.y
                ) {
                    continue;
                }

                for (
                    let px = 0;
                    px < 256;
                    px += STEP
                ) {

                    const gx =
                        t.x *
                        256 +
                        px;

                    if (
                        gx < nw.x ||
                        gx > se.x
                    ) {
                        continue;
                    }

                    if (
                        mask &&
                        !mask[
                            (
                                (
                                    gy -
                                    y0 *
                                    256
                                ) /
                                STEP *
                                mw +
                                (
                                    gx -
                                    x0 *
                                    256
                                ) /
                                STEP
                            ) *
                            4 +
                            3
                        ]
                    ) {
                        continue;
                    }

                    const i =
                        (
                            py *
                            256 +
                            px
                        ) *
                        4;

                    if (
                        t.d[i + 3] <
                        128
                    ) {
                        continue;
                    }

                    const val =
                        colorToValue(
                            name,
                            t.d[i],
                            t.d[i + 1],
                            t.d[i + 2]
                        );

                    bins[
                        Math.min(
                            BINS - 1,
                            Math.floor(
                                (
                                    val + 1
                                ) /
                                2 *
                                BINS
                            )
                        )
                    ]++;

                    count++;
                    sum += val;

                    if (
                        val > thr
                    ) {
                        above++;
                    }
                }
            }
        }
    }

    drawHist(
        name,
        bins,
        count
    );

    const dl =
        $('#stats');

    if (!count) {

        dl.innerHTML =
            `<dt>${
                readBlocked
                    ? 'Odczyt pikseli zablokowany (uruchom przez http)'
                    : 'Brak danych w widoku'
            }</dt><dd></dd>`;

        return;
    }

    let acc =
        0;

    let median =
        0;

    for (
        let i = 0;
        i < BINS;
        i++
    ) {

        acc +=
            bins[i];

        if (
            acc >=
            count / 2
        ) {

            median =
                -1 +
                (
                    i +
                    0.5
                ) *
                2 /
                BINS;

            break;
        }
    }

    dl.innerHTML =
        `<dt>Średnia</dt>` +
        `<dd>${fmt(sum / count)}</dd>` +

        `<dt>Mediana</dt>` +
        `<dd>${fmt(median)}</dd>` +

        `<dt>Udział: ${INFO[name].thrLabel}</dt>` +
        `<dd>${
            (
                above /
                count *
                100
            )
                .toFixed(1)
                .replace('.', ',')
        }%</dd>` +

        `<dt>Próbek</dt>` +
        `<dd>${
            count.toLocaleString(
                'pl-PL'
            )
        }</dd>`;
}


// ============================================================
// HISTOGRAM
// ============================================================

function drawHist(
    name,
    bins,
    count
) {

    const c =
        $('#hist');

    const ctx =
        c.getContext(
            '2d'
        );

    const W =
        c.width;

    const H =
        c.height;

    const pad =
        10;

    const base =
        H - 22;

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    const max =
        Math.max(
            1,
            ...bins
        );

    const bw =
        (
            W -
            2 *
            pad
        ) /
        BINS;

    for (
        let i = 0;
        i < BINS;
        i++
    ) {

        const h =
            count
                ? bins[i] /
                    max *
                    (
                        base -
                        pad
                    )
                : 0;

        ctx.fillStyle =
            lutCss(
                name,
                -1 +
                (
                    i +
                    0.5
                ) *
                2 /
                BINS
            );

        ctx.fillRect(
            pad +
            i *
            bw +
            1,
            base -
            h,
            bw -
            2,
            Math.max(
                h,
                1
            )
        );
    }

    ctx.fillStyle =
        '#8fa3b8';

    ctx.font =
        '18px Segoe UI, sans-serif';

    ctx.textBaseline =
        'bottom';

    ctx.textAlign =
        'left';

    ctx.fillText(
        '−1',
        pad,
        H - 1
    );

    ctx.textAlign =
        'center';

    ctx.fillText(
        '0',
        W / 2,
        H - 1
    );

    ctx.textAlign =
        'right';

    ctx.fillText(
        '1',
        W - pad,
        H - 1
    );

    ctx.fillStyle =
        'rgba(255,255,255,.25)';

    ctx.fillRect(
        W / 2,
        pad,
        1,
        base - pad
    );
}


// ============================================================
// SUMMARY
// ============================================================

let summary =
    null;

function renderSummary() {

    const dl =
        $('#summary');

    if (!dl) {
        return;
    }

    const name =
        $('#layer').value;

    const s =
        summary &&
        (
            summary[name] ||

            (
                summary.indices &&
                summary.indices[name]
            ) ||

            (
                summary.layers &&
                summary.layers[name]
            ) ||

            (
                summary.stats &&
                summary.stats[name]
            )
        );

    const rows =
        s &&
        typeof s ===
            'object'

            ? Object
                .entries(s)
                .filter(
                    ([, v]) =>
                        typeof v ===
                        'number'
                )
                .slice(
                    0,
                    8
                )

            : [];

    dl.hidden =
        !rows.length;

    const PL = {
        count:
            'Ważne piksele',
        min:
            'Minimum',
        max:
            'Maksimum',
        mean:
            'Średnia',
        median:
            'Mediana',
        outside_minus1_plus1:
            'Poza [−1, 1]'
    };

    dl.innerHTML =
        rows.map(
            ([k, v]) =>
                `<dt>${PL[k] || k} (cały obszar)</dt>` +
                `<dd>${
                    Number.isInteger(v)
                        ? v.toLocaleString(
                            'pl-PL'
                        )
                        : v
                            .toFixed(3)
                            .replace('.', ',')
                }</dd>`
        ).join('');
}


// ============================================================
// GRANICA OBSZARU
// ============================================================

let aoiLayer =
    null;

function geometryRings(g) {

    const rings =
        [];

    const add =
        geom => {

            if (!geom) {
                return;
            }

            if (
                geom.type ===
                'Polygon'
            ) {

                rings.push(
                    ...geom.coordinates
                );

            } else if (
                geom.type ===
                'MultiPolygon'
            ) {

                geom.coordinates
                    .forEach(
                        p =>
                            rings.push(
                                ...p
                            )
                    );

            } else if (
                geom.type ===
                'GeometryCollection'
            ) {

                geom.geometries
                    .forEach(
                        add
                    );
            }
        };

    (
        g.type ===
        'FeatureCollection'
            ? g.features
            : [g]
    ).forEach(
        f =>
            add(
                f.type ===
                'Feature'
                    ? f.geometry
                    : f
            )
    );

    return rings;
}


// ============================================================
// CIEKAWE MIEJSCA
// ============================================================

function renderPlaces() {

    const box =
        $('#places');

    if (!box) {
        return;
    }

    box.innerHTML =
        '';

    const places =
        currentArea.places ||
        [];

    if (
        !places.length
    ) {

        const p =
            document.createElement(
                'p'
            );

        p.className =
            'note';

        p.textContent =
            'Brak zdefiniowanych ciekawych miejsc dla tego obszaru.';

        box.appendChild(
            p
        );

        return;
    }

    places.forEach(
        p => {

            const b =
                document.createElement(
                    'button'
                );

            b.className =
                'place';

            b.type =
                'button';

            b.innerHTML =
                `${p.name}<small>${p.hint}</small>`;

            b.addEventListener(
                'click',
                () => {

                    setLayer(
                        p.layer
                    );

                    map.flyTo(
                        p.ll,
                        p.z,
                        {
                            duration:
                                1.2
                        }
                    );
                }
            );

            box.appendChild(
                b
            );
        }
    );
}


// ============================================================
// DOSTĘPNE WARSTWY
// ============================================================

function applyAvailableLayers(
    avail = LAYERS
) {

    const allowed =
        new Set(
            avail
        );

    document
        .querySelectorAll(
            '#layer option'
        )
        .forEach(
            o => {

                if (
                    LAYERS.includes(
                        o.value
                    )
                ) {

                    o.disabled =
                        !allowed.has(
                            o.value
                        );
                }
            }
        );

    document
        .querySelectorAll(
            '#compare option'
        )
        .forEach(
            o => {

                if (
                    LAYERS.includes(
                        o.value
                    )
                ) {

                    o.disabled =
                        !allowed.has(
                            o.value
                        );
                }
            }
        );

    document
        .querySelectorAll(
            '#layer-chips .chip'
        )
        .forEach(
            c => {

                c.hidden =
                    !allowed.has(
                        c.dataset.key
                    );
            }
        );

    const layerSel =
        $('#layer');

    if (
        layerSel &&
        !allowed.has(
            layerSel.value
        )
    ) {

        const first =
            LAYERS.find(
                n =>
                    allowed.has(n)
            );

        if (first) {

            layerSel.value =
                first;
        }
    }

    const compareSel =
        $('#compare');

    if (
        compareSel &&
        LAYERS.includes(
            compareSel.value
        ) &&
        !allowed.has(
            compareSel.value
        )
    ) {

        compareSel.value =
            'base';
    }
}


// ============================================================
// DATA SCENY
// ============================================================

function sceneText(meta) {

    const product =
        meta &&
        meta.product
            ? meta.product
            : 'Sentinel-2';

    const date =
        meta &&
        /^\d{4}-\d{2}-\d{2}$/.test(
            meta.date || ''
        )
            ? meta.date
            : null;

    if (!date) {
        return product;
    }

    const d =
        new Date(
            date +
            'T12:00:00'
        ).toLocaleDateString(
            'pl-PL',
            {
                day:
                    'numeric',
                month:
                    'long',
                year:
                    'numeric'
            }
        );

    return (
        `${product.replace(/ L\d[AC]$/, '')}, ` +
        `scena z ${d}`
    );
}


function updateSceneInfo(meta) {

    const label =
        sceneText(
            meta
        );

    if (
        $('#scene-foot')
    ) {

        $('#scene-foot').textContent =
            label;
    }
}


// ============================================================
// SUMMARY DLA OBSZARU
// ============================================================

async function loadSummaryForArea() {

    summary =
        null;

    applyAvailableLayers(
        LAYERS
    );

    renderSummary();

    const summaryNote =
        $('#summary-note');

    const summaryLink =
        $('#summary-link');

    if (
        !currentArea.summary
    ) {

        if (summaryNote) {
            summaryNote.hidden =
                true;
        }

        updateSceneInfo(
            currentArea.fallbackScene
        );

        return;
    }

    if (summaryLink) {

        summaryLink.href =
            currentArea.summary;
    }

    if (summaryNote) {

        summaryNote.hidden =
            false;
    }

    try {

        const r =
            await fetch(
                currentArea.summary
            );

        if (r.ok) {

            summary =
                await r.json();
        }

    } catch (_) {
    }

    if (
        summary &&
        summary.tiles &&
        typeof summary.tiles ===
            'object'
    ) {

        applyAvailableLayers(
            Object.keys(
                summary.tiles
            )
        );
    }

    if (
        summary &&
        summary.product
    ) {

        updateSceneInfo(
            summary
        );

    } else {

        updateSceneInfo(
            currentArea.fallbackScene
        );
    }

    renderSummary();
}


// ============================================================
// ZMIANA OBSZARU KRAKÓW / TARNÓW
// ============================================================

async function loadArea(
    key,
    fit = true
) {

    if (!AREAS[key]) {
        return;
    }

    areaKey =
        key;

    currentArea =
        AREAS[key];

    if (
        $('#city')
    ) {

        $('#city').textContent =
            currentArea.name;
    }

    if (
        $('#area')
    ) {

        $('#area').value =
            key;
    }

    if (
        $('#state')
    ) {

        $('#state').textContent =
            `Wczytywanie danych dla: ${currentArea.name}…`;

        $('#state')
            .classList
            .remove(
                'error'
            );
    }

    clearTimeout(
        statsTimer
    );

    statsToken++;

    tileCache.clear();

    if (leftIdx) {

        map.removeLayer(
            leftIdx
        );

        leftIdx =
            null;
    }

    if (overlay) {

        map.removeLayer(
            overlay
        );

        overlay =
            null;
    }

    if (
        sideBySideControl
    ) {

        map.removeControl(
            sideBySideControl
        );

        sideBySideControl =
            null;
    }

    if (aoiLayer) {

        map.removeLayer(
            aoiLayer
        );

        aoiLayer =
            null;
    }

    aoiRings =
        null;

    map.getPane(
        'aoiPane'
    ).style.clipPath =
        '';

    const r =
        await fetch(
            currentArea.aoi
        );

    if (!r.ok) {

        throw new Error(
            `Nie udało się wczytać ${currentArea.aoi}`
        );
    }

    const g =
        await r.json();

    aoiLayer =
        L.geoJSON(
            g,
            {
                style: {
                    color:
                        '#2c3e50',
                    weight:
                        1.5,
                    fill:
                        false
                },
                interactive:
                    false
            }
        );

    if (
        !$('#aoi-toggle') ||
        $('#aoi-toggle').checked
    ) {

        aoiLayer.addTo(
            map
        );
    }

    aoiRings =
        geometryRings(
            g
        );

    currentBounds =
        currentArea.bounds

            ? L.latLngBounds(
                currentArea.bounds
            )

            : aoiLayer.getBounds();

    if (fit) {

        map.fitBounds(
            currentBounds
        );
    }

    updateClip();

    renderPlaces();

    await loadSummaryForArea();

    change();
}


// ============================================================
// WŁĄCZANIE / WYŁĄCZANIE GRANICY
// ============================================================

const aoiToggle =
    $('#aoi-toggle');

if (aoiToggle) {

    aoiToggle.addEventListener(
        'change',
        e => {

            if (!aoiLayer) {

                map.eachLayer(
                    l => {

                        if (
                            l instanceof
                            L.GeoJSON
                        ) {

                            aoiLayer =
                                l;
                        }
                    }
                );
            }

            if (!aoiLayer) {
                return;
            }

            if (
                e.target.checked
            ) {

                aoiLayer.addTo(
                    map
                );

            } else {

                map.removeLayer(
                    aoiLayer
                );
            }
        }
    );
}


// ============================================================
// SELECT OBSZARU
// ============================================================

if (
    $('#area')
) {

    $('#area')
        .addEventListener(
            'change',
            e => {

                loadArea(
                    e.target.value
                ).catch(
                    err => {

                        console.error(
                            err
                        );

                        $('#state').textContent =
                            'Błąd wczytywania obszaru.';

                        $('#state')
                            .classList
                            .add(
                                'error'
                            );
                    }
                );
            }
        );
}


// ============================================================
// CHIPY
// ============================================================

function chip(
    parent,
    key,
    onClick
) {

    if (!parent) {
        return;
    }

    const b =
        document.createElement(
            'button'
        );

    b.className =
        'chip';

    b.type =
        'button';

    b.dataset.key =
        key;

    b.textContent =
        key;

    b.addEventListener(
        'click',
        onClick
    );

    parent.appendChild(
        b
    );
}


function setLayer(name) {

    const option =
        [
            ...$('#layer').options
        ].find(
            o =>
                o.value ===
                name
        );

    if (
        !option ||
        option.disabled
    ) {
        return;
    }

    $('#layer').value =
        name;

    change();
}


LAYERS.forEach(
    n =>
        chip(
            $('#layer-chips'),
            n,
            () =>
                setLayer(n)
        )
);


Object
    .keys(
        BASEMAPS
    )
    .forEach(
        k =>
            chip(
                $('#basemaps'),
                k,
                () =>
                    setBasemap(k)
            )
    );


if (
    $('#compare')
) {

    $('#compare')
        .addEventListener(
            'change',
            change
        );
}


$('#opacity')
    .addEventListener(
        'input',
        e => {

            const o =
                Number(
                    e.target.value
                );

            if (leftIdx) {

                leftIdx.setOpacity(
                    o
                );
            }

            const out =
                $('#opacity-out');

            if (out) {

                out.textContent =
                    Math.round(
                        o *
                        100
                    ) +
                    '%';
            }
        }
    );


// ============================================================
// PEŁNY EKRAN
// ============================================================

function toggleFullscreen() {

    if (
        document.fullscreenElement
    ) {

        document.exitFullscreen();

    } else if (
        document
            .documentElement
            .requestFullscreen
    ) {

        document
            .documentElement
            .requestFullscreen();
    }
}


if (
    $('#fullscreen')
) {

    $('#fullscreen')
        .addEventListener(
            'click',
            toggleFullscreen
        );
}


document.addEventListener(
    'fullscreenchange',
    () =>
        setTimeout(
            () =>
                map.invalidateSize(),
            150
        )
);


// ============================================================
// KOPIOWANIE LINKU
// ============================================================

if (
    $('#share')
) {

    $('#share')
        .addEventListener(
            'click',
            async () => {

                const btn =
                    $('#share');

                try {

                    await navigator
                        .clipboard
                        .writeText(
                            location.href
                        );

                    btn.textContent =
                        'Skopiowano ✓';

                } catch (e) {

                    btn.textContent =
                        'Skopiuj z paska adresu';
                }

                setTimeout(
                    () =>
                        btn.textContent =
                            'Kopiuj link',
                    1800
                );
            }
        );
}


// ============================================================
// KLAWIATURA
// ============================================================

document.addEventListener(
    'keydown',
    e => {

        if (
            e.ctrlKey ||
            e.metaKey ||
            e.altKey
        ) {
            return;
        }

        if (
            /^(INPUT|SELECT|TEXTAREA)$/
                .test(
                    e.target.tagName
                )
        ) {
            return;
        }

        const n =
            Number(
                e.key
            );

        if (
            n >= 1 &&
            n <=
                LAYERS.length
        ) {

            setLayer(
                LAYERS[
                    n - 1
                ]
            );

        } else if (
            e.key === 'f' ||
            e.key === 'F'
        ) {

            toggleFullscreen();
        }
    }
);


// ============================================================
// LINK DO WIDOKU
// ============================================================

let ready =
    false;

function writeHash() {

    if (!ready) {
        return;
    }

    const c =
        map.getCenter();

    history.replaceState(
        null,
        '',
        `#${areaKey}/${$('#layer').value}/${map.getZoom()}/${c.lat.toFixed(4)}/${c.lng.toFixed(4)}`
    );
}


function readHash() {

    const p =
        location.hash
            .slice(1)
            .split('/');

    if (
        p.length === 5 &&
        AREAS[p[0]] &&
        LAYERS.includes(
            p[1]
        )
    ) {

        const z =
            Number(
                p[2]
            );

        const lat =
            Number(
                p[3]
            );

        const lng =
            Number(
                p[4]
            );

        if (
            ![
                z,
                lat,
                lng
            ].every(
                Number.isFinite
            )
        ) {
            return null;
        }

        $('#layer').value =
            p[1];

        return {
            area:
                p[0],
            view: [
                lat,
                lng,
                z
            ]
        };
    }

    if (
        p.length === 4 &&
        LAYERS.includes(
            p[0]
        )
    ) {

        const z =
            Number(
                p[1]
            );

        const lat =
            Number(
                p[2]
            );

        const lng =
            Number(
                p[3]
            );

        if (
            ![
                z,
                lat,
                lng
            ].every(
                Number.isFinite
            )
        ) {
            return null;
        }

        $('#layer').value =
            p[0];

        return {
            area:
                'krakow',
            view: [
                lat,
                lng,
                z
            ]
        };
    }

    return null;
}


map.on(
    'moveend',
    () => {

        writeHash();

        scheduleStats();
    }
);


// ============================================================
// START
// ============================================================

const initial =
    readHash();

setBasemap(
    'OSM'
);

loadArea(
    initial
        ? initial.area
        : 'krakow',
    !initial
)
    .then(
        () => {

            if (initial) {

                map.setView(
                    [
                        initial.view[0],
                        initial.view[1]
                    ],
                    initial.view[2]
                );
            }

            ready =
                true;

            writeHash();
        }
    )
    .catch(
        err => {

            console.error(
                err
            );

            $('#state').textContent =
                'Błąd inicjalizacji mapy.';

            $('#state')
                .classList
                .add(
                    'error'
                );
        }
    );