import type { YatmoLanguage, YatmoTravelMode } from './config.js';
import { TRAVEL_MODE_SUMMARY_CODES } from './config.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Position { latitude: number; longitude: number }

// ---- /points ----------------------------------------------------------------------------------

/** Wire shape of GET /points (compact keys). */
interface PoiWire {
  n: string; t: string; la: number; ln: number; p: string; i: string; si: string; g: boolean;
  rpt?: string | null; sd?: string | null; fid?: string | null;
}

/** One point of interest. */
export interface YatmoPoi {
  id: string;
  name: string;
  /** Translated type, for example "Preschool" or "Bus stop (Dansaert)". */
  type: string;
  latitude: number;
  longitude: number;
  /** Category id, the value to pass in `poiTypeIds`. */
  categoryId: string;
  /** Icon ids (several when POIs share the same position). */
  iconIds: string[];
  /** Sub-icon ids (transit lines). */
  subIconIds: string[];
  grouped: boolean;
  /** Specific data as a JSON string (transit lines, brand...), "{}" when empty. */
  specificData: string | null;
  filterId: string | null;
}

export function poiFromWire(w: PoiWire): YatmoPoi {
  return {
    id: `${w.la},${w.ln},${w.n}`,
    name: w.n, type: w.t, latitude: w.la, longitude: w.ln, categoryId: w.p,
    iconIds: (w.i ?? '').split(',').filter(Boolean),
    subIconIds: (w.si ?? '').split(',').filter(Boolean),
    grouped: !!w.g, specificData: w.sd ?? null, filterId: w.fid ?? null,
  };
}

// ---- /summary ---------------------------------------------------------------------------------

export interface YatmoTravelData {
  hasTravelInformation: boolean;
  /** 1 driving, 2 walking, 3 bicycling, 4 transit. */
  travelModeCode: number;
  travelMode: YatmoTravelMode | null;
  translatedTravelMode: string | null;
  distanceMeters: number | null;
  distanceLongLabel: string | null;
  distanceShortLabel: string | null;
  travelTimeSeconds: number | null;
  travelTimeLongLabel: string | null;
  travelTimeShortLabel: string | null;
  travelTimeExtraShortLabel: string | null;
}

export interface YatmoSummaryPlace {
  categoryId: number;
  icon: number;
  subIcon: number;
  latitude: number;
  longitude: number;
  name: string;
  specificData: string | null;
  travelData: YatmoTravelData[];
}

export interface YatmoSummarySubCategory {
  subType: number;
  label: string;
  singularLabel: string | null;
  places: YatmoSummaryPlace[];
}

export interface YatmoSummaryCategory {
  /** Stable across languages: 1 education, 2 transport, 3 shopping, 7 tourism. */
  categoryType: number;
  label: string;
  subCategories: YatmoSummarySubCategory[];
}

export interface YatmoCloseCity {
  /** City name per language code (EN, FR, NL...). */
  names: Record<string, string>;
  travelData: YatmoTravelData[];
  center: Position | null;
}

export interface YatmoPlaceInformation {
  streetName: string | null;
  isLocality: boolean;
  cityName: string | null;
  zipCode: string | null;
  localizedStreetNames: Record<string, string> | null;
  localizedCityNames: Record<string, string> | null;
}

/** GET /summary: nearby places grouped by category, closest cities and reverse-geocoded place. */
export interface YatmoSummary {
  categories: YatmoSummaryCategory[];
  closeCities: YatmoCloseCity[];
  placeInformation: YatmoPlaceInformation | null;
}

function travelModeFromCode(code: number): YatmoTravelMode | null {
  const entry = (Object.entries(TRAVEL_MODE_SUMMARY_CODES) as [YatmoTravelMode, number][]).find(([, c]) => c === code);
  return entry ? entry[0] : null;
}

function travelDataFromWire(t: any): YatmoTravelData {
  return {
    hasTravelInformation: !!t.hti, travelModeCode: t.tm ?? 0, travelMode: travelModeFromCode(t.tm ?? 0),
    translatedTravelMode: t.ttm ?? null, distanceMeters: t.ptdd ?? null, distanceLongLabel: t.ptdll ?? null,
    distanceShortLabel: t.ptdsl ?? null, travelTimeSeconds: t.tt ?? null, travelTimeLongLabel: t.ttll ?? null,
    travelTimeShortLabel: t.ttsl ?? null, travelTimeExtraShortLabel: t.ttesl ?? null,
  };
}

export function summaryFromWire(w: any): YatmoSummary {
  return {
    categories: (w.AvailableCategoriesAroundPosition ?? []).map((c: any) => ({
      categoryType: c.ct ?? 0, label: c.l ?? '',
      subCategories: (c.sc ?? []).map((s: any) => ({
        subType: s.st ?? 0, label: s.l ?? '', singularLabel: s.lb ?? null,
        places: (s.d ?? []).map((d: any) => ({
          categoryId: d.id ?? 0, icon: d.i ?? 0, subIcon: d.si ?? 0, latitude: d.la, longitude: d.lo, name: d.n ?? '',
          specificData: d.sd ?? null, travelData: (d.td ?? []).map(travelDataFromWire),
        })),
      })),
    })),
    closeCities: (w.CloseCities ?? []).map((c: any) => ({
      names: c.n ?? {}, travelData: (c.td ?? []).map(travelDataFromWire),
      center: c.c ? { latitude: c.c.Latitude, longitude: c.c.Longitude } : null,
    })),
    placeInformation: w.PlaceInformation ? {
      streetName: w.PlaceInformation.StreetName ?? null, isLocality: !!w.PlaceInformation.IsLocality,
      cityName: w.PlaceInformation.CityName ?? null, zipCode: w.PlaceInformation.ZipCode ?? null,
      localizedStreetNames: w.PlaceInformation.LocalizedStreetNames ?? null, localizedCityNames: w.PlaceInformation.LocalizedCityNames ?? null,
    } : null,
  };
}

// ---- /Summary/text ----------------------------------------------------------------------------

/** A string per language code, as the API sends titles and sentences. */
export type LocalizedText = Record<string, string>;

/** One paragraph of the neighbourhood text, in every language of the country. */
export interface YatmoTextParagraphRaw {
  /** Stable paragraph type: education, shopping, publictransports, transports, tourism, cities. */
  iconId: string;
  title: LocalizedText;
  /** Title naming the street, when known. */
  titleStreet: LocalizedText | null;
  /** Title naming the city, when known. */
  titleCity: LocalizedText | null;
  sentences: LocalizedText[];
  /** Bullet items (rare). */
  items: LocalizedText[];
}

/** GET /Summary/text as sent by the API: every language at once, worth caching for 30 days. */
export interface YatmoSummaryTextRaw {
  paragraphs: YatmoTextParagraphRaw[];
  /** Language codes present in the first paragraph, for example ["FR", "EN", "NL"] in Belgium. */
  languages: string[];
}

export function summaryTextRawFromWire(w: any): YatmoSummaryTextRaw {
  const paragraphs: YatmoTextParagraphRaw[] = (w.Paragraphs ?? []).map((p: any) => ({
    iconId: p.IconId ?? '',
    title: p.Title ?? {},
    titleStreet: p.TitleBis && Object.keys(p.TitleBis).length ? p.TitleBis : null,
    titleCity: p.TitleTer && Object.keys(p.TitleTer).length ? p.TitleTer : null,
    sentences: (p.Sentences ?? []).filter((s: any) => s && typeof s === 'object'),
    items: (p.List ?? []).filter((s: any) => s && typeof s === 'object'),
  }));
  return { paragraphs, languages: Object.keys(paragraphs[0]?.title ?? {}) };
}

/** One paragraph resolved to a language. Sentences keep the `[STRONG]...[/STRONG]` markers around key places. */
export interface YatmoTextParagraph {
  iconId: string;
  title: string;
  titleStreet: string | null;
  titleCity: string | null;
  sentences: string[];
  items: string[];
  /** The sentences joined with a space, markers included. */
  text: string;
}

/** The neighbourhood text in one language. */
export interface YatmoSummaryText {
  /** The language actually used: the requested one when the country has it, else EN, else the first one. */
  language: string;
  paragraphs: YatmoTextParagraph[];
  /** Every paragraph's text, separated by blank lines, markers included. */
  text: string;
}

/** Picks the requested language when the text exists in it, else English, else the first one. */
export function pickLanguage(localized: LocalizedText | null | undefined, language: string): string | null {
  if (!localized) return null;
  for (const candidate of [language, 'EN']) {
    if (localized[candidate]) return candidate;
  }
  const first = Object.keys(localized)[0];
  return first ?? null;
}

export function resolveSummaryText(raw: YatmoSummaryTextRaw, language: YatmoLanguage | string): YatmoSummaryText {
  const first = raw.paragraphs[0];
  const used = pickLanguage(first?.title, language) ?? language;
  const paragraphs = raw.paragraphs
    .map((p): YatmoTextParagraph | null => {
      const lang = pickLanguage(p.title, language);
      if (!lang) return null;
      const sentences = p.sentences.map((s) => s[lang]).filter((s): s is string => !!s);
      const items = p.items.map((s) => s[lang]).filter((s): s is string => !!s);
      if (!sentences.length && !items.length) return null;
      return {
        iconId: p.iconId, title: p.title[lang] ?? '', titleStreet: p.titleStreet?.[lang] ?? null,
        titleCity: p.titleCity?.[lang] ?? null, sentences, items, text: sentences.join(' '),
      };
    })
    .filter((p): p is YatmoTextParagraph => p !== null);
  return { language: used, paragraphs, text: paragraphs.map((p) => p.text).join('\n\n') };
}

// ---- /scores ----------------------------------------------------------------------------------

export interface YatmoScore {
  /** Stable key: publicTransport, trains, motorways, nurseries, schools, supermarkets... */
  key: string;
  label: string;
  /** 0 to 10. */
  value: number;
  iconId: number | null;
  categoryType: number | null;
  subTypes: number[];
}

export interface YatmoScores {
  scores: YatmoScore[];
  language: string | null;
}

export function scoresFromWire(w: any): YatmoScores {
  return {
    scores: (w.scores ?? []).map((s: any) => ({
      key: s.k ?? '', label: s.l ?? '', value: s.v ?? 0, iconId: s.iconId ?? null, categoryType: s.pt ?? null, subTypes: s.st ?? [],
    })),
    language: w.language ?? null,
  };
}

// ---- /enrichment (camelCase on the wire, used as is) -------------------------------------------

export interface YatmoTravelInfo { distanceMeters: number; durationSeconds: number; durationMinutes: number }

export interface YatmoNearestPoi {
  name: string; latitude: number; longitude: number; straightLineDistanceMeters: number;
  walking?: YatmoTravelInfo | null; bicycling?: YatmoTravelInfo | null; driving?: YatmoTravelInfo | null; transit?: YatmoTravelInfo | null;
}

export interface YatmoEnrichedCategory { id: number; key: string; group: string; label: string; nearest?: YatmoNearestPoi | null }

/** GET /enrichment: the nearest place of each category with routed distances and times. */
export interface YatmoEnrichment {
  latitude: number; longitude: number; country: string; language: string; searchRadiusMeters: number;
  categories: YatmoEnrichedCategory[];
}

// ---- /isochrone -------------------------------------------------------------------------------

/** Minimal GeoJSON geometry shape, to avoid a dependency on @types/geojson. */
export interface YatmoGeometry { type: 'Polygon' | 'MultiPolygon' | string; coordinates: unknown }

/** One reachable area. `geometry` is the GeoJSON geometry (Polygon or MultiPolygon) returned by the API. */
export interface YatmoIsochrone { label: string; geometry: YatmoGeometry }

// ---- /route -----------------------------------------------------------------------------------

export interface YatmoRoutePath {
  distanceMeters: number;
  durationSeconds: number;
  /** GeoJSON LineString, coordinates as [longitude, latitude] pairs. */
  geometry: YatmoGeometry;
  instructions: unknown[] | null;
}

/** GET /route: the paths from an origin to a destination (usually one). */
export interface YatmoRoute { paths: YatmoRoutePath[]; info: unknown }

export function routeFromWire(w: any): YatmoRoute {
  return {
    paths: (w.paths ?? []).map((p: any) => ({
      distanceMeters: p.distance ?? 0, durationSeconds: Math.round((p.time ?? 0) / 1000),
      geometry: p.points ?? { type: 'LineString', coordinates: [] }, instructions: p.instructions ?? null,
    })),
    info: w.info ?? null,
  };
}

// ---- /geolocation (Photon) --------------------------------------------------------------------

export interface YatmoPlace {
  name: string | null; street: string | null; houseNumber: string | null; postcode: string | null; city: string | null;
  country: string | null; countryCode: string | null; type: string | null; latitude: number; longitude: number;
  /** "Rue Neuve, 1000 Brussels" style single line. */
  label: string;
}

export function placeFromFeature(f: any): YatmoPlace | null {
  const coordinates = f?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const p = f.properties ?? {};
  const cityLine = [p.postcode, p.city].filter(Boolean).join(' ');
  const streetLine = [p.street ?? p.name, p.housenumber].filter(Boolean).join(' ');
  return {
    name: p.name ?? null, street: p.street ?? null, houseNumber: p.housenumber ?? null, postcode: p.postcode ?? null,
    city: p.city ?? null, country: p.country ?? null, countryCode: p.countrycode ?? null, type: p.type ?? null,
    latitude: coordinates[1], longitude: coordinates[0],
    label: [streetLine, cityLine].filter(Boolean).join(', '),
  };
}

// ---- /SimplifiedCategories --------------------------------------------------------------------

/** Category ids grouped by family (Education, Transports, Motorways, Shopping, Tourism...). */
export interface YatmoCategoryGroup { name: string; poiTypeIds: number[] }
