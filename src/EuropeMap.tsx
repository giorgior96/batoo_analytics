/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON as LeafletGeoJSON } from 'react-leaflet';
import { feature } from 'topojson-client';
import worldCountries from 'world-atlas/countries-110m.json';
import 'leaflet/dist/leaflet.css';

interface EuropeMapProps {
  countriesData: { name: string; count: number; percentage: number; avg_price?: number }[];
  isDark: boolean;
  lang: 'it' | 'en';
}

const WORLD_GEOJSON = feature(worldCountries as any, (worldCountries as any).objects.countries);

const COUNTRY_ALIASES: Record<string, string> = {
  it: 'italy',
  ita: 'italy',
  italia: 'italy',
  fr: 'france',
  fra: 'france',
  francia: 'france',
  es: 'spain',
  esp: 'spain',
  spagna: 'spain',
  hr: 'croatia',
  hrv: 'croatia',
  croazia: 'croatia',
  gr: 'greece',
  grc: 'greece',
  grecia: 'greece',
  de: 'germany',
  deu: 'germany',
  germania: 'germany',
  nl: 'netherlands',
  nld: 'netherlands',
  olanda: 'netherlands',
  gb: 'united kingdom',
  gbr: 'united kingdom',
  uk: 'united kingdom',
  'regno unito': 'united kingdom',
  'regno-unito': 'united kingdom',
  tr: 'turkey',
  tur: 'turkey',
  turchia: 'turkey',
  ch: 'switzerland',
  che: 'switzerland',
  svizzera: 'switzerland',
  pt: 'portugal',
  prt: 'portugal',
  portogallo: 'portugal',
  mc: 'monaco',
  mco: 'monaco',
  me: 'montenegro',
  mne: 'montenegro',
  si: 'slovenia',
  svn: 'slovenia',
  mt: 'malta',
  mlt: 'malta',
  cy: 'cyprus',
  cyp: 'cyprus',
  cipro: 'cyprus',
  us: 'united states of america',
  usa: 'united states of america',
  'stati uniti': 'united states of america',
  'stati-uniti': 'united states of america',
  'stati-uniti-d-america': 'united states of america'
};

const normalizeCountryName = (value = '') => {
  const normalized = value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  return COUNTRY_ALIASES[normalized] || normalized;
};

const getHeatColor = (intensity: number) => {
  if (intensity >= 0.75) return '#172554';
  if (intensity >= 0.5) return '#2563eb';
  if (intensity >= 0.25) return '#38bdf8';
  return '#bfdbfe';
};

const formatPrice = (value?: number) => {
  if (!value) return null;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
};

export default function EuropeMap({ countriesData, isDark, lang }: EuropeMapProps) {
  // Fix per un warning noto di React StrictMode con Leaflet che non re-renderizza bene la mappa se cambiano le dimensioni
  const [mapRendered, setMapRendered] = useState(false);

  useEffect(() => {
    // Piccolo delay per assicurarsi che il contenitore padre abbia le dimensioni finali
    const timer = setTimeout(() => setMapRendered(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { countryStats, maxCount } = useMemo(() => {
    const max = Math.max(...countriesData.map(country => country.count || 0), 1);
    const stats: Record<string, any> = {};

    countriesData.forEach(country => {
      const key = normalizeCountryName(country.name);
      stats[key] = {
        ...country,
        intensity: (country.count || 0) / max
      };
    });

    return { countryStats: stats, maxCount: max };
  }, [countriesData]);

  const getCountryStat = (geoFeature: any) => {
    const name = normalizeCountryName(geoFeature?.properties?.name);
    return countryStats[name];
  };

  const countryStyle = (geoFeature: any) => {
    const stat = getCountryStat(geoFeature);

    if (!stat) {
      return {
        fillColor: isDark ? '#334155' : '#e2e8f0',
        fillOpacity: isDark ? 0.12 : 0.28,
        color: isDark ? '#475569' : '#cbd5e1',
        weight: 0.6,
        opacity: 0.65
      };
    }

    return {
      fillColor: getHeatColor(stat.intensity),
      fillOpacity: 0.42 + (0.42 * stat.intensity),
      color: isDark ? '#dbeafe' : '#ffffff',
      weight: 1.1,
      opacity: 0.95
    };
  };

  const onEachCountryFeature = (geoFeature: any, layer: any) => {
    const stat = getCountryStat(geoFeature);
    if (!stat) return;

    const avgPrice = formatPrice(stat.avg_price);
    layer.bindTooltip(
      `<div class="text-center font-sans">
        <strong class="block text-sm">${stat.name}</strong>
        <span class="text-blue-600 font-bold">${stat.percentage}%</span>
        <span class="text-slate-500 text-xs ml-1">(${stat.count} ${lang === 'it' ? 'barche' : 'boats'})</span>
        ${avgPrice ? `<span class="block text-xs mt-1 text-slate-500">${lang === 'it' ? 'Prezzo medio' : 'Avg price'}: <strong>${avgPrice}</strong></span>` : ''}
      </div>`,
      { sticky: true, opacity: 1 }
    );

    layer.on({
      mouseover: () => layer.setStyle({ weight: 2, fillOpacity: 0.9 }),
      mouseout: () => layer.setStyle(countryStyle(geoFeature))
    });
  };

  if (!mapRendered) return <div className="w-full h-[250px] animate-pulse bg-slate-200/20 rounded-xl" />;

  // Centro la mappa in Europa (Nord Italia/Svizzera)
  const mapCenter: [number, number] = [46.0, 9.0]; 
  const zoomLevel = 4;

  const tileUrl = isDark 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={mapCenter as any} 
        zoom={zoomLevel} 
        scrollWheelZoom={false}
        className="w-full h-full absolute inset-0"
        style={{ background: isDark ? '#1a1d24' : '#e5e7eb' }}
      >
        <TileLayer
          attribution='&copy; <a href=\"https://carto.com/\">CARTO</a> & Natural Earth' as any
          url={tileUrl}
        />
        <LeafletGeoJSON
          key={`${isDark ? 'dark' : 'light'}-${maxCount}-${countriesData.map(country => `${country.name}:${country.count}`).join('|')}`}
          data={WORLD_GEOJSON as any}
          style={countryStyle as any}
          onEachFeature={onEachCountryFeature as any}
        />
      </MapContainer>
      <div className={`absolute bottom-3 left-3 z-[400] rounded-xl px-3 py-2 shadow-lg border backdrop-blur-md ${isDark ? 'bg-slate-950/80 border-white/10 text-slate-200' : 'bg-white/90 border-slate-200 text-slate-700'}`}>
        <div className="text-[10px] uppercase tracking-widest font-bold mb-1">
          {lang === 'it' ? 'Presenza annunci' : 'Listings volume'}
        </div>
        <div className="h-2 w-32 rounded-full bg-gradient-to-r from-blue-200 via-sky-400 via-blue-600 to-blue-950" />
        <div className="mt-1 flex justify-between text-[10px] font-semibold opacity-70">
          <span>{lang === 'it' ? 'Bassa' : 'Low'}</span>
          <span>{lang === 'it' ? 'Alta' : 'High'}</span>
        </div>
      </div>
    </div>
  );
}
