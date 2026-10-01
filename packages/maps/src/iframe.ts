import { MAP_STYLE_IDS, type YatmoCountry, type YatmoLanguage, type YatmoMapStyle } from '@yatmo/sdk';

export const IFRAME_URL = 'https://map.yatmo.com/plugin.html';

/** Options of the iframe plugin. Reference: https://documentation.yatmo.com/plugins/iframe */
export interface IframeOptions {
  /** Your frontend key, the one locked to your domains. */
  key: string;
  country: YatmoCountry;
  /** Defaults to EN. */
  language?: YatmoLanguage;
  latitude: number;
  longitude: number;
  /** Layout. Defaults to `overlay` (map with the summary over it). */
  mode?: 'overlay' | 'overlay-scores' | 'map-top' | 'map' | 'summary' | 'summary-tabs';
  /** 7 to 20, defaults to 15. */
  zoom?: number;
  /** Basemap style, by name or by number (1 to 7). */
  mapStyle?: YatmoMapStyle | number;
  /** Hex colour of the pin and highlights, for example `#428BFF`. */
  accentColor?: string;
  /** `pin` (default), `circle` (hides the exact address) or `custom`. */
  marker?: 'pin' | 'circle' | 'custom';
  /** Radius of the circle marker in metres (50 to 2000). */
  circleRadiusInMeters?: number;
  /** Custom marker image (HTTPS PNG or SVG) with its size in pixels. */
  customMarker?: { url: string; width: number; height: number };
  /** Corner radius in pixels (1 to 15). */
  rounded?: number;
  /** Isochrone panel (5, 10 and 20 minute areas). */
  isochrone?: 'left' | 'right';
  /** Route from the property to the place the visitor clicks. */
  routeFrom?: 'left' | 'right' | 'popup';
  summaryBackgroundColor?: string;
  summaryLineColor?: string;
  /** Favourite addresses: a stable, unique id of the logged-in visitor on your site. */
  userId?: string;
  /** Point the commute times are measured from, when favourites are on. */
  startLatitude?: number;
  startLongitude?: number;
  /** Any other parameter, appended as is. */
  extra?: Record<string, string>;
}

export interface IframeElementOptions extends IframeOptions {
  /** CSS height, `560px` by default. A number is taken as pixels. */
  height?: string | number;
  /** Accessible title. */
  title?: string;
  className?: string;
}

function coordinate(value: number): string {
  return Number(value).toFixed(7).replace(/0+$/, '').replace(/\.$/, '');
}

/** The URL of the iframe plugin for these options. */
export function iframeUrl(options: IframeOptions): string {
  const params = new URLSearchParams({
    licenseKey: options.key,
    country: options.country,
    language: options.language ?? 'EN',
    latitude: coordinate(options.latitude),
    longitude: coordinate(options.longitude),
    mode: options.mode ?? 'overlay',
    zoom: String(options.zoom ?? 15),
  });
  if (options.mapStyle !== undefined) {
    params.set('mapStyle', String(typeof options.mapStyle === 'number' ? options.mapStyle : MAP_STYLE_IDS[options.mapStyle]));
  }
  if (options.accentColor) params.set('accentColor', options.accentColor);
  const marker = options.marker === 'custom' && !options.customMarker ? 'pin' : options.marker;
  if (marker) params.set('marker', marker);
  if (marker === 'circle' && options.circleRadiusInMeters) params.set('circleRadiusInMeters', String(options.circleRadiusInMeters));
  if (marker === 'custom' && options.customMarker) {
    params.set('customMarkerUrl', options.customMarker.url);
    params.set('customMarkerWidth', String(options.customMarker.width));
    params.set('customMarkerHeight', String(options.customMarker.height));
  }
  if (options.rounded) params.set('rounded', `${options.rounded}px`);
  if (options.isochrone) params.set('isochrone', options.isochrone);
  if (options.routeFrom) params.set('routeFrom', options.routeFrom);
  if (options.summaryBackgroundColor) params.set('summaryBackgroundColor', options.summaryBackgroundColor);
  if (options.summaryLineColor) params.set('summaryLineColor', options.summaryLineColor);
  if (options.userId) params.set('userId', options.userId);
  if (options.startLatitude !== undefined) params.set('startLatitude', coordinate(options.startLatitude));
  if (options.startLongitude !== undefined) params.set('startLongitude', coordinate(options.startLongitude));
  for (const [k, v] of Object.entries(options.extra ?? {})) params.set(k, v);
  return `${IFRAME_URL}?${params.toString()}`;
}

/** Creates the `<iframe>` element (lazy, full width, no border) without inserting it. */
export function createIframe(options: IframeElementOptions): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.src = iframeUrl(options);
  iframe.title = options.title ?? 'Map and neighbourhood of the property';
  iframe.loading = 'lazy';
  iframe.setAttribute('allow', 'fullscreen');
  if (options.className) iframe.className = options.className;
  // A bare number (number or digits-only string, as from an HTML attribute) is in pixels.
  const raw = options.height === undefined ? '560px' : String(options.height).trim();
  const height = /^\d+(\.\d+)?$/.test(raw) ? `${raw}px` : raw;
  iframe.style.display = 'block';
  iframe.style.width = '100%';
  iframe.style.height = height;
  iframe.style.border = '0';
  return iframe;
}

/** Inserts the iframe into a container (element or id), replacing its content. */
export function mountIframe(container: HTMLElement | string, options: IframeElementOptions): HTMLIFrameElement {
  const host = typeof container === 'string' ? document.getElementById(container) : container;
  if (!host) throw new Error(`Yatmo: container "${container}" not found`);
  const iframe = createIframe(options);
  host.replaceChildren(iframe);
  return iframe;
}
