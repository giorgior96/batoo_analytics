import mixpanel from 'mixpanel-browser';

const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined;

// Inizializza solo se il token è configurato
if (TOKEN) {
  mixpanel.init(TOKEN, {
    track_pageview: true,
    persistence: 'localStorage',
    ignore_dnt: false,
  });
}

const enabled = !!TOKEN;

export const mp = {
  /** Ricerca modello barca */
  trackSearch: (query: string, year: string, lang: string) => {
    if (!enabled) return;
    mixpanel.track('Search', { query, year: year || null, lang });
  },

  /** Risultati ricevuti */
  trackSearchResult: (query: string, totalResults: number, avgPrice: number, lang: string) => {
    if (!enabled) return;
    mixpanel.track('Search Result', { query, total_results: totalResults, avg_price: avgPrice, lang });
  },

  /** Ricerca per agenzia/broker */
  trackSellerSearch: (seller: string, lang: string) => {
    if (!enabled) return;
    mixpanel.track('Seller Search', { seller, lang });
  },

  /** Click su un comparable (link esterno) */
  trackComparableClick: (source: string, price: number, year: number | null) => {
    if (!enabled) return;
    mixpanel.track('Comparable Click', { source, price, year });
  },

  /** Export PDF */
  trackPDFExport: (query: string) => {
    if (!enabled) return;
    mixpanel.track('PDF Export', { query });
  },

  /** Switch lingua */
  trackLangSwitch: (to: 'it' | 'en') => {
    if (!enabled) return;
    mixpanel.track('Language Switch', { to });
  },

  /** Switch tema */
  trackThemeSwitch: (to: 'dark' | 'light') => {
    if (!enabled) return;
    mixpanel.track('Theme Switch', { to });
  },

  /** Click su un quick link (Axopar, Beneteau, ecc.) */
  trackQuickLink: (query: string) => {
    if (!enabled) return;
    mixpanel.track('Quick Link Click', { query });
  },

  /** Apertura filtri avanzati */
  trackFiltersOpen: () => {
    if (!enabled) return;
    mixpanel.track('Filters Opened');
  },

  /** Applicazione di un filtro */
  trackFilterApplied: (filterType: 'source' | 'country' | 'price_min' | 'price_max', value: string) => {
    if (!enabled) return;
    mixpanel.track('Filter Applied', { filter_type: filterType, value });
  },

  /** Stima personalizzata usata */
  trackPersonalEstimate: (query: string, year: string, estimatedPrice: number) => {
    if (!enabled) return;
    mixpanel.track('Personal Estimate', { query, year, estimated_price: estimatedPrice });
  },
};
