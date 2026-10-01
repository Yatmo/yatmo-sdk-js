/** Version sent in the X-Yatmo-SDK header. Keep in sync with package.json. */
export const YATMO_SDK_VERSION = '1.0.1';

/** Countries served by the Yatmo API. The value is the sub-domain: `https://{country}.yatmo.com/`. */
export type YatmoCountry =
  | 'BE' | 'FR' | 'NL' | 'LU' | 'CH' | 'DE' | 'IT' | 'ES' | 'PT' | 'IE' | 'UK' | 'AT' | 'CA'
  | 'GR' | 'MA' | 'AU' | 'HR' | 'MT' | 'SI' | 'RS' | 'CY' | 'BA' | 'ME' | 'BG' | 'AL';

export const YATMO_COUNTRIES: readonly YatmoCountry[] = [
  'AL', 'AT', 'AU', 'BA', 'BE', 'BG', 'CA', 'CH', 'CY', 'DE', 'ES', 'FR', 'GR', 'HR', 'IE', 'IT', 'LU', 'MA', 'ME',
  'MT', 'NL', 'PT', 'RS', 'SI', 'UK',
];

/** Languages accepted by the `language` parameter of the API (CNR = Montenegrin, which has no ISO 639-1 code). */
export type YatmoLanguage =
  | 'EN' | 'FR' | 'NL' | 'DE' | 'IT' | 'ES' | 'PT' | 'CA' | 'ZH' | 'HI' | 'AR' | 'RU' | 'JA'
  | 'EL' | 'HR' | 'MT' | 'SL' | 'SR' | 'TR' | 'BS' | 'SQ' | 'BG' | 'CNR';

/** The seven map styles of the web plugins and of the static map endpoint. */
export type YatmoMapStyle = 'liberty' | 'basic' | 'bright' | '3d' | 'positron' | 'dark' | 'liberty_stonehedge';

export const MAP_STYLE_IDS: Record<YatmoMapStyle, number> = {
  liberty: 1, basic: 2, bright: 3, '3d': 4, positron: 5, dark: 6, liberty_stonehedge: 7,
};

/** Travel modes of the routing endpoints. */
export type YatmoTravelMode = 'walking' | 'bicycling' | 'driving' | 'transit';

export const TRAVEL_MODE_API_NAMES: Record<YatmoTravelMode, string> = {
  driving: 'Driving', walking: 'Walking', bicycling: 'Bicycling', transit: 'Transit',
};

/** Numeric codes used inside the Summary payload (`td[].tm`). */
export const TRAVEL_MODE_SUMMARY_CODES: Record<YatmoTravelMode, number> = {
  driving: 1, walking: 2, bicycling: 3, transit: 4,
};

export interface YatmoConfiguration {
  /**
   * Your Yatmo key. On a server, the backend key. In a browser, only ever the frontend key (the one
   * locked to your domains), and prefer the plugins of @yatmo/maps for anything shown to visitors.
   */
  key: string;
  country: YatmoCountry;
  /** Language of the labels and texts. Defaults to EN. */
  language?: YatmoLanguage;
  /** Override the API host, for staging environments. Defaults to `https://{country}.yatmo.com/`. */
  apiBaseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 15000. */
  timeoutMs?: number;
  /** Custom fetch, for runtimes without a global one or for tests. Defaults to `globalThis.fetch`. */
  fetch?: typeof fetch;
  /** Extra headers sent with every request (for example the mobile app id headers). */
  headers?: Record<string, string>;
}

export function resolveBaseUrl(configuration: YatmoConfiguration): string {
  const base = configuration.apiBaseUrl ?? `https://${configuration.country.toLowerCase()}.yatmo.com/`;
  return base.endsWith('/') ? base : base + '/';
}

/**
 * Thrown by the client. `status` is the HTTP status: 400 = point outside the country or bad
 * parameter, 401 = key missing or unknown, 403 = feature, country or origin not allowed by the
 * key, 429 = quota, 0 = network or timeout.
 */
export class YatmoError extends Error {
  constructor(public readonly status: number, message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'YatmoError';
  }
}
