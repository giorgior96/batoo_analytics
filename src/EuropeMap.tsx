/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Fragment, useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Coordinate approssimative (Lat, Lng) per il centro delle nazioni Europee principali
const COUNTRY_COORDS: Record<string, [number, number]> = {
  // ISO-2
  'it': [41.8719, 12.5674],
  'fr': [46.2276, 2.2137],
  'es': [40.4637, -3.7492],
  'hr': [45.1, 15.2],
  'gr': [39.0742, 21.8243],
  'de': [51.1657, 10.4515],
  'nl': [52.1326, 5.2913],
  'gb': [55.3781, -3.4360],
  'uk': [55.3781, -3.4360],
  'tr': [38.9637, 35.2433],
  'ch': [46.8182, 8.2275],
  'pt': [39.3999, -8.2245],
  'mc': [43.7384, 7.4246],
  'me': [42.7087, 19.3744],
  'si': [46.1512, 14.9955],
  'mt': [35.9375, 14.3975],
  'cy': [35.9375, 33.3975],
  'us': [37.0902, -95.7129],
  
  // ISO-3
  'ita': [41.8719, 12.5674],
  'fra': [46.2276, 2.2137],
  'esp': [40.4637, -3.7492],
  'hrv': [45.1, 15.2],
  'grc': [39.0742, 21.8243],
  'deu': [51.1657, 10.4515],
  'nld': [52.1326, 5.2913],
  'gbr': [55.3781, -3.4360],
  'tur': [38.9637, 35.2433],
  'che': [46.8182, 8.2275],
  'prt': [39.3999, -8.2245],
  'mco': [43.7384, 7.4246],
  'mne': [42.7087, 19.3744],
  'svn': [46.1512, 14.9955],
  'mlt': [35.9375, 14.3975],
  'cyp': [35.9375, 33.3975],
  'usa': [37.0902, -95.7129],

  // Esteso
  'italia': [41.8719, 12.5674],
  'italy': [41.8719, 12.5674],
  'francia': [46.2276, 2.2137],
  'france': [46.2276, 2.2137],
  'spagna': [40.4637, -3.7492],
  'spain': [40.4637, -3.7492],
  'croazia': [45.1, 15.2],
  'croatia': [45.1, 15.2],
  'grecia': [39.0742, 21.8243],
  'greece': [39.0742, 21.8243],
  'germania': [51.1657, 10.4515],
  'germany': [51.1657, 10.4515],
  'olanda': [52.1326, 5.2913],
  'netherlands': [52.1326, 5.2913],
  'united kingdom': [55.3781, -3.4360],
  'regno unito': [55.3781, -3.4360],
  'regno-unito': [55.3781, -3.4360],
  'turchia': [38.9637, 35.2433],
  'turkey': [38.9637, 35.2433],
  'svizzera': [46.8182, 8.2275],
  'switzerland': [46.8182, 8.2275],
  'portogallo': [39.3999, -8.2245],
  'portugal': [39.3999, -8.2245],
  'monaco': [43.7384, 7.4246],
  'montenegro': [42.7087, 19.3744],
  'slovenia': [46.1512, 14.9955],
  'malta': [35.9375, 14.3975],
  'cipro': [35.9375, 33.3975],
  'cyprus': [35.9375, 33.3975],
  'stati-uniti': [37.0902, -95.7129],
  'stati uniti': [37.0902, -95.7129],
  'stati-uniti-d-america': [37.0902, -95.7129]
};

interface EuropeMapProps {
  countriesData: { name: string; count: number; percentage: number; avg_price?: number }[];
  isDark: boolean;
  lang: 'it' | 'en';
}

const getHeatColor = (intensity: number) => {
  if (intensity >= 0.75) return '#ef4444';
  if (intensity >= 0.5) return '#f97316';
  if (intensity >= 0.25) return '#f59e0b';
  return '#38bdf8';
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

  if (!mapRendered) return <div className="w-full h-[250px] animate-pulse bg-slate-200/20 rounded-xl" />;

  // Heat layer aggregato per nazione: niente coordinate inventate per singoli annunci.
  let maxCount = 0;
  const aggregateMarkers = countriesData.map(c => {
    if (c.count > maxCount) maxCount = c.count;
    const nameLower = c.name.toLowerCase();
    
    let coords = COUNTRY_COORDS[nameLower];
    if (!coords) {
      const foundKey = Object.keys(COUNTRY_COORDS).find(k => nameLower.includes(k) || k.includes(nameLower.replace('-', ' ')));
      coords = foundKey ? COUNTRY_COORDS[foundKey] : null as any;
    }
    
    if (!coords) {
       const noDash = nameLower.replace(/-/g, ' ');
       if (COUNTRY_COORDS[noDash]) coords = COUNTRY_COORDS[noDash];
    }

    return {
      ...c,
      coords
    };
  }).filter(m => m.coords);

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
          attribution='&copy; <a href=\"https://carto.com/\">CARTO</a>' as any
          url={tileUrl}
        />
        
        {aggregateMarkers.map((marker, idx) => {
          const intensity = marker.count / (maxCount || 1);
          const radius = 16 + (42 * Math.sqrt(intensity));
          const color = getHeatColor(intensity);
          const avgPrice = formatPrice(marker.avg_price);

          return (
            <Fragment key={`heat-${idx}`}>
              <CircleMarker
                center={marker.coords}
                radius={radius as any}
                fillColor={color}
                fillOpacity={0.22 + (0.35 * intensity)}
                color={color}
                opacity={0.7}
                weight={1.5}
              >
                <Tooltip direction="top" offset={[0, -10] as any} opacity={1} as any>
                  <div className="text-center font-sans">
                    <strong className="block text-sm">{marker.name}</strong>
                    <span className="text-blue-600 font-bold">{marker.percentage}%</span> 
                    <span className="text-slate-500 text-xs ml-1">({marker.count} {lang === 'it' ? 'barche' : 'boats'})</span>
                    {avgPrice && (
                      <span className="block text-xs mt-1 text-slate-500">
                        {lang === 'it' ? 'Prezzo medio' : 'Avg price'}: <strong>{avgPrice}</strong>
                      </span>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
              <CircleMarker
                center={marker.coords}
                radius={Math.max(6, radius * 0.34) as any}
                fillColor={color}
                fillOpacity={0.72}
                color={isDark ? '#f8fafc' : '#ffffff'}
                opacity={0.85}
                weight={1}
                interactive={false}
              />
            </Fragment>
          );
        })}
      </MapContainer>
      <div className={`absolute bottom-3 left-3 z-[400] rounded-xl px-3 py-2 shadow-lg border backdrop-blur-md ${isDark ? 'bg-slate-950/80 border-white/10 text-slate-200' : 'bg-white/90 border-slate-200 text-slate-700'}`}>
        <div className="text-[10px] uppercase tracking-widest font-bold mb-1">
          {lang === 'it' ? 'Presenza annunci' : 'Listings volume'}
        </div>
        <div className="h-2 w-32 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 via-orange-500 to-red-500" />
        <div className="mt-1 flex justify-between text-[10px] font-semibold opacity-70">
          <span>{lang === 'it' ? 'Bassa' : 'Low'}</span>
          <span>{lang === 'it' ? 'Alta' : 'High'}</span>
        </div>
      </div>
    </div>
  );
}
