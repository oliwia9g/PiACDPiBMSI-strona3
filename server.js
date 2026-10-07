import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);

const TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const PROCESS_URL = 'https://sh.dataspace.copernicus.eu/process/v1';
const PRG_ITEMS_URL = 'https://ogcapi.geoportal.gov.pl/res/ims/maps/PRG/apiFeatures/collections/GranicaGminy/items';

const CITIES = {
  krakow: {
    name: 'Kraków',
    teryt: '1261011',
    fallbackBbox: [19.75, 49.95, 20.25, 50.18]
  },
  gdansk: {
    name: 'Gdańsk',
    teryt: '2261011',
    fallbackBbox: [18.45, 54.25, 18.95, 54.55]
  },
  tarnow: {
    name: 'Tarnów',
    teryt: '1263011',
    fallbackBbox: [20.80, 49.90, 21.20, 50.12]
  }
};

const RAMPS = {
  NDVI: ['#a50026', '#de3f2e', '#f88e52', '#fdd481', '#fefebd', '#cbe881', '#84ca66', '#2a9f54', '#006837'],
  NDBI: ['#2d004b', '#5f3a91', '#998fbf', '#cfcee5', '#f7f6f5', '#fdd59f', '#ed9b39', '#bc6109', '#7f3b08'],
  MNDWI: ['#543005', '#995d12', '#cfa255', '#f0dfb2', '#f4f4f4', '#b3e2db', '#58b0a6', '#0c7068', '#003c30'],
  NDWI: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'],
  NDMI: ['#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e']
};

const INDEX_DEFS = {
  NDVI: { bands: ['B04', 'B08'], expression: '(s.B08 - s.B04) / (s.B08 + s.B04)' },
  NDBI: { bands: ['B08', 'B11'], expression: '(s.B11 - s.B08) / (s.B11 + s.B08)' },
  MNDWI: { bands: ['B03', 'B11'], expression: '(s.B03 - s.B11) / (s.B03 + s.B11)' },
  NDWI: { bands: ['B03', 'B08'], expression: '(s.B03 - s.B08) / (s.B03 + s.B08)' },
  NDMI: { bands: ['B08', 'B11'], expression: '(s.B08 - s.B11) / (s.B08 + s.B11)' }
};

function hexToRgb01(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
function makeRamp(name) {
  const colors = RAMPS[name];
  return colors.map((hex, i) => [-1 + (2 * i) / (colors.length - 1), hexToRgb01(hex)]);
}

function evalscriptFor(indexName) {
  if (indexName === 'RGB') {
    return `//VERSION=3
function setup() {
  return { input: ["B02", "B03", "B04", "SCL", "dataMask"], output: { bands: 4, sampleType: "AUTO" } };
}
function isCloud(scl) { return [0, 1, 3, 8, 9, 10, 11].includes(scl); }
function evaluatePixel(s) {
  if (s.dataMask === 0 || isCloud(s.SCL)) return [0, 0, 0, 0];
  return [Math.min(1, 2.5 * s.B04), Math.min(1, 2.5 * s.B03), Math.min(1, 2.5 * s.B02), 1];
}`;
  }

  const def = INDEX_DEFS[indexName];
  if (!def) throw new Error(`Nieobsługiwany wskaźnik: ${indexName}`);
  const inputBands = [...new Set([...def.bands, 'SCL', 'dataMask'])];
  const ramp = JSON.stringify(makeRamp(indexName));

  return `//VERSION=3
function setup() {
  return { input: ${JSON.stringify(inputBands)}, output: { bands: 4, sampleType: "AUTO" } };
}
const ramp = ${ramp};
const viz = new ColorRampVisualizer(ramp);
function isCloud(scl) { return [0, 1, 3, 8, 9, 10, 11].includes(scl); }
function evaluatePixel(s) {
  if (s.dataMask === 0 || isCloud(s.SCL)) return [0, 0, 0, 0];
  const v = ${def.expression};
  if (!Number.isFinite(v) || Math.abs(v) > 10) return [0, 0, 0, 0];
  const clamped = Math.max(-1, Math.min(1, v));
  const rgb = viz.process(clamped);
  return [rgb[0], rgb[1], rgb[2], 1];
}`;
}

function monthRange(year, month) {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  return { from: from.toISOString(), to: to.toISOString() };
}

function outputSizeForBbox(bbox) {
  const [w, s, e, n] = bbox;
  const midLat = (s + n) / 2 * Math.PI / 180;
  const groundRatio = Math.max(0.3, Math.min(3, ((e - w) * Math.cos(midLat)) / (n - s)));
  let width = 1200;
  let height = Math.round(width / groundRatio);
  if (height > 1200) {
    height = 1200;
    width = Math.round(height * groundRatio);
  }
  width = Math.max(700, Math.min(1200, width));
  height = Math.max(700, Math.min(1200, height));
  return { width, height };
}

const boundaryCache = new Map();

function geometryBbox(geometry) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return null;
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  const visit = value => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
      west = Math.min(west, value[0]);
      south = Math.min(south, value[1]);
      east = Math.max(east, value[0]);
      north = Math.max(north, value[1]);
      return;
    }
    value.forEach(visit);
  };
  visit(geometry.coordinates);
  return [west, south, east, north].every(Number.isFinite) ? [west, south, east, north] : null;
}

function fallbackBoundary(cityKey, reason = null) {
  const city = CITIES[cityKey];
  return {
    key: cityKey,
    name: city.name,
    teryt: city.teryt,
    bbox: city.fallbackBbox,
    geometry: null,
    exact: false,
    source: 'fallback bbox',
    warning: reason ? String(reason) : null
  };
}

async function getCityBoundary(cityKey) {
  if (boundaryCache.has(cityKey)) return boundaryCache.get(cityKey);
  const city = CITIES[cityKey];
  if (!city) throw new Error('Nieobsługiwane miasto.');

  const params = new URLSearchParams({
    f: 'json',
    bbox: city.fallbackBbox.join(','),
    limit: '100'
  });

  const response = await fetch(`${PRG_ITEMS_URL}?${params}`, {
    headers: {
      Accept: 'application/geo+json, application/json;q=0.9, */*;q=0.1',
      'User-Agent': 'PiACDPiBMSI-Sentinel-App/1.0'
    }
  });
  if (!response.ok) throw new Error(`PRG/GUGiK zwrócił HTTP ${response.status}`);

  const data = await response.json();
  const features = Array.isArray(data.features) ? data.features : [];
  const feature = features.find(f => String(f?.properties?.kod ?? '') === city.teryt)
    || features.find(f => String(f?.properties?.nazwaJednostki ?? '').toLocaleLowerCase('pl-PL') === city.name.toLocaleLowerCase('pl-PL'));

  if (!feature?.geometry || !['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
    throw new Error(`Nie znaleziono granicy PRG dla ${city.name} (TERYT ${city.teryt}).`);
  }

  const bbox = Array.isArray(feature.bbox) && feature.bbox.length >= 4
    ? feature.bbox.slice(0, 4).map(Number)
    : geometryBbox(feature.geometry);
  if (!bbox || !bbox.every(Number.isFinite)) throw new Error(`PRG zwrócił nieprawidłowy bbox dla ${city.name}.`);

  const boundary = {
    key: cityKey,
    name: city.name,
    teryt: city.teryt,
    bbox,
    geometry: feature.geometry,
    exact: true,
    source: 'Państwowy Rejestr Granic (GUGiK)',
    prgId: feature.id || feature.properties?.idLokalny || null
  };
  boundaryCache.set(cityKey, boundary);
  console.log(`[PRG] ${city.name} TERYT=${city.teryt} bbox=${bbox.join(',')} ${boundary.prgId || ''}`);
  return boundary;
}

async function getCityBoundarySafe(cityKey) {
  try {
    return await getCityBoundary(cityKey);
  } catch (error) {
    console.warn(`[PRG fallback] ${CITIES[cityKey]?.name || cityKey}: ${error.message}`);
    return fallbackBoundary(cityKey, error.message);
  }
}

let tokenCache = { token: null, expiresAt: 0 };
async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt - 60_000) return tokenCache.token;

  const clientId = process.env.CDSE_CLIENT_ID;
  const clientSecret = process.env.CDSE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Brak CDSE_CLIENT_ID lub CDSE_CLIENT_SECRET w pliku .env');

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Nie udało się pobrać tokenu OAuth (${response.status}): ${text.slice(0, 500)}`);
  }
  const data = await response.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: now + Number(data.expires_in || 300) * 1000
  };
  return tokenCache.token;
}

const imageCache = new Map();
const MAX_CACHE_ITEMS = 36;
function putCache(key, buffer) {
  if (imageCache.has(key)) imageCache.delete(key);
  imageCache.set(key, buffer);
  while (imageCache.size > MAX_CACHE_ITEMS) imageCache.delete(imageCache.keys().next().value);
}
function imageHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 10);
}
function setImageHeaders(res, key, buffer, cityKey, boundary) {
  res.set('X-Temporal-Selection', key);
  res.set('X-Temporal-Hash', imageHash(buffer));
  res.set('X-Temporal-City', cityKey);
  res.set('X-Temporal-Boundary', boundary?.exact ? 'PRG' : 'fallback-bbox');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
}

app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/cities', async (_req, res) => {
  try {
    const entries = await Promise.all(Object.keys(CITIES).map(async key => {
      const boundary = await getCityBoundarySafe(key);
      return [key, boundary];
    }));
    res.json(Object.fromEntries(entries));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Nie udało się pobrać granic miast.' });
  }
});

app.get('/api/layer', async (req, res) => {
  try {
    const cityKey = String(req.query.city || 'krakow').toLowerCase();
    const city = CITIES[cityKey];
    if (!city) return res.status(400).json({ error: 'Nieobsługiwane miasto.' });

    const indexName = String(req.query.index || 'NDVI').toUpperCase();
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const allowedIndices = [...Object.keys(INDEX_DEFS), 'RGB'];
    if (!allowedIndices.includes(indexName)) return res.status(400).json({ error: 'Nieobsługiwany wskaźnik.' });

    const currentYear = new Date().getUTCFullYear();
    const minYear = currentYear - 4;
    if (!Number.isInteger(year) || year < minYear || year > currentYear) {
      return res.status(400).json({ error: `Rok musi być z zakresu ${minYear}-${currentYear}.` });
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Miesiąc musi być z zakresu 1-12.' });
    }
    const now = new Date();
    if (year === currentYear && month > now.getUTCMonth() + 1) {
      return res.status(400).json({ error: 'Wybrany miesiąc jest jeszcze w przyszłości.' });
    }

    const boundary = await getCityBoundarySafe(cityKey);
    const boundaryTag = boundary.exact ? 'prg' : 'bbox';
    const cacheKey = `${cityKey}-${boundaryTag}-${indexName}-${year}-${String(month).padStart(2, '0')}`;
    const cached = imageCache.get(cacheKey);
    if (cached) {
      res.set('X-Temporal-Cache', 'HIT');
      setImageHeaders(res, cacheKey, cached, cityKey, boundary);
      console.log(`[HIT] ${cacheKey} hash=${imageHash(cached)}`);
      return res.type('png').send(cached);
    }

    const token = await getAccessToken();
    const timeRange = monthRange(year, month);
    const output = outputSizeForBbox(boundary.bbox);
    const bounds = {
      properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
      bbox: boundary.bbox
    };
    if (boundary.geometry) bounds.geometry = boundary.geometry;

    const requestBody = {
      input: {
        bounds,
        data: [{
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange,
            mosaickingOrder: 'leastCC',
            maxCloudCoverage: 40
          }
        }]
      },
      output: {
        ...output,
        responses: [{ identifier: 'default', format: { type: 'image/png' } }]
      },
      evalscript: evalscriptFor(indexName)
    };

    const started = Date.now();
    const response = await fetch(PROCESS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'image/png'
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Process API zwróciło ${response.status}: ${text.slice(0, 1000)}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    putCache(cacheKey, buffer);
    res.set('X-Temporal-Cache', 'MISS');
    setImageHeaders(res, cacheKey, buffer, cityKey, boundary);
    console.log(`[MISS] ${cacheKey} ${output.width}x${output.height} hash=${imageHash(buffer)} bytes=${buffer.length} time=${Date.now() - started}ms`);
    res.type('png').send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Nieznany błąd serwera.' });
  }
});

app.get('/api/health', async (_req, res) => {
  const boundaryStatus = {};
  for (const key of Object.keys(CITIES)) {
    const cached = boundaryCache.get(key);
    boundaryStatus[key] = cached ? 'PRG' : 'not-loaded';
  }
  res.json({ ok: true, cities: Object.keys(CITIES), boundaries: boundaryStatus, cacheItems: imageCache.size });
});

// Statyczny interfejs pozostaje w katalogze głównym projektu. Dotfiles są blokowane,
// więc .env nie jest wystawiany przez serwer.
app.use(express.static(__dirname, { dotfiles: 'deny', index: 'index.html' }));

app.listen(PORT, () => {
  console.log(`\nAplikacja Sentinel-2 działa na: http://localhost:${PORT}`);
  console.log('Granice miast są pobierane automatycznie z PRG (GUGiK).');
  console.log('Uruchamiaj przez npm start / npm.cmd start, nie przez Live Server.\n');

  // Rozgrzanie cache granic; ewentualna awaria PRG nie blokuje uruchomienia aplikacji.
  Promise.allSettled(Object.keys(CITIES).map(getCityBoundary));
});
