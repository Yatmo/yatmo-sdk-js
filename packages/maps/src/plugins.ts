import type { YatmoCountry, YatmoLanguage } from '@yatmo/sdk';

const PLUGIN_HOST = 'https://map.yatmo.com/';

/** Common settings of the three script plugins. */
export interface PluginConfigBase {
  /** Your frontend key, the one locked to your domains. */
  licenseKey: string;
  country: YatmoCountry;
  language: YatmoLanguage;
}

/**
 * Configuration of the JavaScript map plugin (`map_v3.js`). The known options are typed; any other
 * option of the plugin can be added as is. Reference: https://documentation.yatmo.com/plugins/js-map
 */
export interface MapConfigKnown extends PluginConfigBase {
  /** Id of the element that receives the map. */
  container: string;
  /** `[longitude, latitude]`. */
  center: [number, number];
  zoom?: number;
  /** 1 to 7. */
  mapStyle?: number;
  accentColor?: string;
  /** Route from this point to the place the visitor clicks. */
  routeFrom?: { latitude: number; longitude: number };
  fullScreenButton?: boolean;
  /** POI toggle available but hidden at load. */
  startsWithPoisHidden?: boolean;
  noPois?: boolean;
  userAddresses?: { userId: string; [key: string]: unknown };
  travelTimeSearch?: {
    defaultMinutes?: number;
    defaultMode?: 'Walking' | 'Bicycling' | 'Driving' | 'Transit';
    onSearch?: (shape: unknown, meta: unknown) => void;
    [key: string]: unknown;
  };
  listings?: { items?: unknown[]; shape?: unknown; renderCard?: (item: never, close: () => void) => unknown; [key: string]: unknown };
}

/** The known options plus any other option of the plugin. */
export type MapConfig = MapConfigKnown & { [key: string]: unknown };

/** Configuration of the summary table plugin (`summary.js`). https://documentation.yatmo.com/plugins/js-summary */
export interface SummaryConfig extends PluginConfigBase {
  container: string;
  latitude: number;
  longitude: number;
  [key: string]: unknown;
}

/** Configuration of the neighbourhood text plugin (`summary-text.js`). https://documentation.yatmo.com/plugins/js-summary-text */
export interface SummaryTextConfig extends PluginConfigBase {
  latitude: number;
  longitude: number;
  /** Tags around the key places. Default `<strong>` and `</strong>`. */
  beginStrongTag?: string;
  endStrongTag?: string;
  [key: string]: unknown;
}

/** What the text plugin hands back: the paragraphs (HTML with the strong tags) and three flavours of titles. */
export interface SummaryTextResult {
  paragraphs: string[];
  titles: string[];
  /** Titles naming the street. */
  titlesStreet: string[];
  /** Titles naming the city. */
  titlesCity: string[];
  /** Stable paragraph types: education, shopping, transports, publictransports, cities... */
  iconIds: string[];
}

export interface MountTextOptions {
  /** Id of the element that receives the text (used by the default renderer). */
  container?: string;
  /** Heading tag of the default renderer. Defaults to `h3`. */
  heading?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Street name in the first title and city in the second (default), city only, or generic titles. */
  titles?: 'street-city' | 'city' | 'generic';
  /** Replaces the default renderer. */
  render?: (result: SummaryTextResult) => void;
}

const loaded = new Map<string, Promise<void>>();

/** Loads a script once; resolves when it ran. */
export function loadScript(src: string): Promise<void> {
  let pending = loaded.get(src);
  if (!pending) {
    pending = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { loaded.delete(src); reject(new Error(`Yatmo: cannot load ${src}`)); };
      document.head.appendChild(script);
    });
    loaded.set(src, pending);
  }
  return pending;
}

type GlobalWindow = Window & {
  yatmoConfig?: MapConfig;
  yatmoSummaryConfig?: SummaryConfig;
  yatmoSummaryTextConfig?: SummaryTextConfig;
  addSummaryTextWithTitles?: (paragraphs: string[], titles: string[], titlesStreet: string[], titlesCity: string[], iconIds: string[]) => void;
};

/**
 * Mounts the JavaScript map in `config.container`. The plugin reads its configuration from the
 * global `yatmoConfig` and handles one map per page: call it once; for several maps, use iframes.
 */
export async function mountMap(config: MapConfig): Promise<void> {
  (window as GlobalWindow).yatmoConfig = config;
  await loadScript(PLUGIN_HOST + 'map_v3.js');
}

/** Mounts the summary table (nearest places by category) in `config.container`. */
export async function mountSummary(config: SummaryConfig): Promise<void> {
  (window as GlobalWindow).yatmoSummaryConfig = config;
  await loadScript(PLUGIN_HOST + 'summary.js');
}

/**
 * Loads the neighbourhood text and renders it: by default as headings and paragraphs in
 * `options.container`, or through `options.render`. Resolves with the paragraphs and titles.
 * For search engines, prefer rendering the text on the server with @yatmo/sdk.
 */
export function mountSummaryText(config: SummaryTextConfig, options: MountTextOptions = {}): Promise<SummaryTextResult> {
  return new Promise<SummaryTextResult>((resolve, reject) => {
    const w = window as GlobalWindow;
    w.yatmoSummaryTextConfig = { beginStrongTag: '<strong>', endStrongTag: '</strong>', ...config };
    w.addSummaryTextWithTitles = (paragraphs, titles, titlesStreet, titlesCity, iconIds) => {
      const result: SummaryTextResult = { paragraphs, titles, titlesStreet: titlesStreet ?? [], titlesCity: titlesCity ?? [], iconIds: iconIds ?? [] };
      if (options.render) options.render(result);
      else renderText(result, options);
      resolve(result);
    };
    loadScript(PLUGIN_HOST + 'summary-text.js').catch(reject);
  });
}

function renderText(result: SummaryTextResult, options: MountTextOptions): void {
  const host = options.container ? document.getElementById(options.container) : null;
  if (!host) throw new Error('Yatmo: mountSummaryText needs options.container or options.render');
  const heading = options.heading ?? 'h3';
  const mode = options.titles ?? 'street-city';
  host.replaceChildren();
  result.paragraphs.forEach((paragraph, index) => {
    let title = result.titles[index] ?? '';
    if (mode === 'street-city' && index === 0 && result.titlesStreet[index]) title = result.titlesStreet[index];
    else if (mode === 'street-city' && index === 1 && result.titlesCity[index]) title = result.titlesCity[index];
    else if (mode === 'city' && index === 0 && result.titlesCity[index]) title = result.titlesCity[index];
    if (title) {
      const h = document.createElement(heading);
      h.textContent = title;
      host.appendChild(h);
    }
    const p = document.createElement('p');
    p.innerHTML = paragraph;
    host.appendChild(p);
  });
}
