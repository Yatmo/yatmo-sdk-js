import {
  MAP_STYLE_IDS, TRAVEL_MODE_API_NAMES, YATMO_SDK_VERSION, YatmoError, resolveBaseUrl,
  type YatmoConfiguration, type YatmoMapStyle, type YatmoTravelMode,
} from './config.js';
import {
  placeFromFeature, poiFromWire, resolveSummaryText, routeFromWire, scoresFromWire, summaryFromWire, summaryTextRawFromWire,
  type Position, type YatmoCategoryGroup, type YatmoEnrichment, type YatmoGeometry, type YatmoIsochrone, type YatmoPlace,
  type YatmoPoi, type YatmoRoute, type YatmoScores, type YatmoSummary, type YatmoSummaryText, type YatmoSummaryTextRaw,
} from './models.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PointsOptions {
  /** South-west corner of the box. */
  southWest: Position;
  /** North-east corner of the box. */
  northEast: Position;
  /** Category ids to keep (see `simplifiedCategories()`). Defaults to every category. */
  poiTypeIds?: number[];
}

export interface IsochroneOptions extends Position {
  mode: YatmoTravelMode;
  /** Travel-time limit in seconds: 300, 600, 1200... */
  seconds: number;
}

export interface RouteOptions {
  from: Position;
  to: Position;
  mode: YatmoTravelMode;
}

export interface StaticMapOptions extends Position {
  /** Hex colour of the pin, with or without `#`. Defaults to the Yatmo blue. */
  color?: string;
  /** Image size in pixels. Defaults to 800 by 450. */
  width?: number;
  height?: number;
  mapStyle?: YatmoMapStyle;
  threeD?: boolean;
  bigIcons?: boolean;
  multiBorders?: boolean;
  /** Custom marker image (HTTPS PNG or SVG) with its size in pixels. */
  customMarker?: { url: string; width: number; height: number };
}

/**
 * Typed client for the Yatmo REST API. Every call sends the key in the `LicenseKey` header and
 * throws a `YatmoError` on failure. One instance per country.
 */
export class YatmoClient {
  readonly configuration: YatmoConfiguration;

  constructor(configuration: YatmoConfiguration) {
    if (!configuration?.key) throw new YatmoError(401, 'Yatmo: the key is required');
    if (!configuration.country) throw new YatmoError(400, 'Yatmo: the country is required');
    this.configuration = { language: 'EN', ...configuration };
  }

  /** The configured language. */
  get language(): string {
    return this.configuration.language ?? 'EN';
  }

  /** GET /summary: nearby places by category with travel times, closest cities, reverse-geocoded place. */
  async summary(p: Position): Promise<YatmoSummary> {
    return summaryFromWire(await this.getJson('summary', this.position(p)));
  }

  /** GET /Summary/text: the neighbourhood paragraphs in every language of the country. Cache it: a location rarely changes. */
  async summaryTextRaw(p: Position): Promise<YatmoSummaryTextRaw> {
    return summaryTextRawFromWire(await this.getJson('Summary/text', this.position(p)));
  }

  /** GET /Summary/text resolved to the configured language (or `language`), with the `[STRONG]` markers kept. See `renderSummaryText`. */
  async summaryText(p: Position, language?: string): Promise<YatmoSummaryText> {
    return resolveSummaryText(await this.summaryTextRaw(p), language ?? this.language);
  }

  /** GET /scores: one 0 to 10 score per category. */
  async scores(p: Position): Promise<YatmoScores> {
    return scoresFromWire(await this.getJson('scores', this.position(p)));
  }

  /** GET /enrichment: the nearest place of each category with distances and times for four travel modes, for listing data. */
  async enrichment(p: Position): Promise<YatmoEnrichment> {
    return (await this.getJson('enrichment', this.position(p))) as YatmoEnrichment;
  }

  /** GET /points inside a bounding box. Ask from zoom 13 upwards and debounce map moves. */
  async points(options: PointsOptions): Promise<YatmoPoi[]> {
    const query: Record<string, string> = {
      bound1: `${fmt(options.southWest.latitude)},${fmt(options.southWest.longitude)}`,
      bound2: `${fmt(options.northEast.latitude)},${fmt(options.northEast.longitude)}`,
      groupSamePositions: 'true',
      caringForBigResponse: 'true',
    };
    if (options.poiTypeIds?.length) query.poiTypesIds = options.poiTypeIds.join(',');
    const wire = (await this.getJson('points', query)) as any[];
    return wire.map(poiFromWire);
  }

  /** GET /Isochrone/GetMultipleTimes: the 5, 10 and 20 minute areas, smallest first. */
  async isochrones(options: Position & { mode: YatmoTravelMode }): Promise<YatmoIsochrone[]> {
    const wire = (await this.getJson('Isochrone/GetMultipleTimes', { ...this.position(options), travelMode: TRAVEL_MODE_API_NAMES[options.mode] })) as any[];
    return wire.map((item) => ({ label: item.label, geometry: item.iso }));
  }

  /** GET /isochrone: the area reachable within `seconds`, as a GeoJSON geometry. */
  async isochrone(options: IsochroneOptions): Promise<YatmoGeometry> {
    const wire = (await this.getJson('isochrone', {
      ...this.position(options), travelMode: TRAVEL_MODE_API_NAMES[options.mode], numberOfSeconds: String(Math.round(options.seconds)),
    })) as any;
    return (wire?.geometry ?? wire) as YatmoGeometry;
  }

  /** GET /route: the route between two points, distance in metres and duration in seconds. */
  async route(options: RouteOptions): Promise<YatmoRoute> {
    return routeFromWire(await this.getJson('route', {
      travelMode: TRAVEL_MODE_API_NAMES[options.mode],
      startLatitude: fmt(options.from.latitude), startLongitude: fmt(options.from.longitude),
      arrivalLatitude: fmt(options.to.latitude), arrivalLongitude: fmt(options.to.longitude),
    }));
  }

  /** GET /geolocation: an address to coordinates, inside the configured country. Best match first. */
  async geocode(address: string): Promise<YatmoPlace[]> {
    return this.places(await this.getJson('geolocation', { address: address.trim() }));
  }

  /** GET /Geolocation/GetClose: address autocomplete near a position, inside the configured country. */
  async geocodeNear(p: Position, query: string): Promise<YatmoPlace[]> {
    return this.places(await this.getJson('Geolocation/GetClose', { ...this.position(p), address: query.trim() }));
  }

  /** GET /SimplifiedCategories: category ids grouped by family, the values accepted by `poiTypeIds`. */
  async simplifiedCategories(): Promise<YatmoCategoryGroup[]> {
    const root = (await this.getJson('SimplifiedCategories', {})) as Record<string, number[]>;
    return Object.entries(root).map(([name, poiTypeIds]) => ({ name, poiTypeIds })).sort((a, b) => a.name.localeCompare(b.name));
  }

  /** GET /image: a JPEG of the map centred on the property, as bytes (the request needs the key header, so this is for servers). */
  async staticMap(options: StaticMapOptions): Promise<Uint8Array> {
    const response = await this.request(this.staticMapUrl(options), 'image/jpeg');
    return new Uint8Array(await response.arrayBuffer());
  }

  /** URL of the static map; the request must carry the `LicenseKey` header (see `headers()`), it is not an `<img>` URL. */
  staticMapUrl(options: StaticMapOptions): string {
    const query: Record<string, string> = {
      ...this.position(options),
      hexaColor: (options.color ?? '#428BFF').replace(/^#/, ''),
      width: String(options.width ?? 800),
      height: String(options.height ?? 450),
    };
    if (options.mapStyle) query.mapStyle = String(MAP_STYLE_IDS[options.mapStyle]);
    if (options.threeD) query.threeDMode = 'true';
    if (options.bigIcons) query.bigIcon = 'true';
    if (options.multiBorders) query.multiborders = 'true';
    if (options.customMarker) {
      query.customMarkerUrl = options.customMarker.url;
      query.customMarkerWidth = String(options.customMarker.width);
      query.customMarkerHeight = String(options.customMarker.height);
    }
    return this.url('image', query);
  }

  /** Headers sent with every request, for callers that need an endpoint not wrapped above. */
  headers(accept = 'application/json'): Record<string, string> {
    return {
      ...(this.configuration.headers ?? {}),
      LicenseKey: this.configuration.key,
      'X-Yatmo-SDK': `yatmo-sdk-js/${YATMO_SDK_VERSION}`,
      Accept: accept,
    };
  }

  /** Full URL of an endpoint with the language appended. */
  url(path: string, query: Record<string, string> = {}): string {
    return resolveBaseUrl(this.configuration) + path + '?' + toQuery({ ...query, language: this.language });
  }

  private async request(url: string, accept: string): Promise<Response> {
    const fetchImpl = this.configuration.fetch ?? globalThis.fetch;
    if (!fetchImpl) throw new YatmoError(0, 'Yatmo: no fetch available, pass one in the configuration');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timer = controller ? setTimeout(() => controller.abort(), this.configuration.timeoutMs ?? 15000) : undefined;
    let response: Response;
    try {
      response = await fetchImpl(url, { headers: this.headers(accept), signal: controller?.signal });
    } catch (e) {
      throw new YatmoError(0, e instanceof Error ? e.message : 'network error', e);
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (!response.ok) {
      const text = await response.text();
      let message = text;
      try { message = JSON.parse(text)?.Error ?? text; } catch { /* plain text body */ }
      throw new YatmoError(response.status, `Yatmo API ${response.status}: ${message}`);
    }
    return response;
  }

  private async getJson(path: string, query: Record<string, string>): Promise<unknown> {
    const response = await this.request(this.url(path, query), 'application/json');
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new YatmoError(response.status, 'Yatmo API: unreadable response', e);
    }
  }

  private places(root: any): YatmoPlace[] {
    return ((root?.features ?? []) as any[]).map(placeFromFeature).filter((p): p is YatmoPlace => p !== null);
  }

  private position(p: Position): Record<string, string> {
    return { latitude: fmt(p.latitude), longitude: fmt(p.longitude) };
  }
}

/** Creates a client: `createYatmoClient({ key, country: 'BE', language: 'FR' })`. */
export function createYatmoClient(configuration: YatmoConfiguration): YatmoClient {
  return new YatmoClient(configuration);
}

function fmt(value: number): string {
  return Number(value).toFixed(7);
}

function toQuery(params: Record<string, string>): string {
  return Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}
