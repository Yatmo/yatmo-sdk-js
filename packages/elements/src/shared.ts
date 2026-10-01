import { createYatmoClient, type YatmoClient, type YatmoCountry, type YatmoLanguage } from '@yatmo/sdk';

/** Settings an element needs to call Yatmo, from its own attributes or from `<yatmo-config>`. */
export interface Settings {
  key: string;
  country: YatmoCountry;
  language: YatmoLanguage;
}

/**
 * `<yatmo-config key="..." country="BE" language="FR">`: page-wide defaults, so the other elements
 * only carry the property location. Put it once, anywhere in the page.
 */
export class YatmoConfigElement extends HTMLElement {}

const DEFAULT_LANGUAGE = 'EN';

/** Attribute of the element, else of the page's `<yatmo-config>`, else the fallback. */
export function setting(el: HTMLElement, name: string, fallback = ''): string {
  const own = el.getAttribute(name);
  if (own !== null && own !== '') return own;
  const config = el.ownerDocument.querySelector('yatmo-config');
  const shared = config?.getAttribute(name);
  return shared !== null && shared !== undefined && shared !== '' ? shared : fallback;
}

/** The key, country and language of an element, or null with a console warning when the key or country is missing. */
export function settingsOf(el: HTMLElement): Settings | null {
  const key = setting(el, 'key');
  const country = setting(el, 'country').toUpperCase();
  if (!key || !country) {
    console.warn(`Yatmo: <${el.tagName.toLowerCase()}> needs a key and a country, on the element or on <yatmo-config>.`);
    return null;
  }
  return { key, country: country as YatmoCountry, language: (setting(el, 'language', DEFAULT_LANGUAGE).toUpperCase() as YatmoLanguage) };
}

/** Latitude and longitude attributes as numbers, or null. */
export function positionOf(el: HTMLElement): Position | null {
  const latitude = Number(el.getAttribute('latitude'));
  const longitude = Number(el.getAttribute('longitude'));
  if (!el.getAttribute('latitude') || !el.getAttribute('longitude') || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    console.warn(`Yatmo: <${el.tagName.toLowerCase()}> needs latitude and longitude attributes.`);
    return null;
  }
  return { latitude, longitude };
}

export function clientFor(settings: Settings): YatmoClient {
  return createYatmoClient({ key: settings.key, country: settings.country, language: settings.language });
}

export interface Position { latitude: number; longitude: number }

/** Geocoded addresses of the page, one call per country and address (several elements share one). */
const geocoded = new Map<string, Promise<Position | null>>();

/**
 * The position of an element: its `latitude` and `longitude` attributes, else its `address` attribute
 * located by Yatmo in the country of the settings (no-code pages only have an address). Null, with a
 * notice already shown, when neither is usable.
 */
export async function locate(el: HTMLElement, settings: Settings): Promise<Position | null> {
  if (el.getAttribute('latitude') || el.getAttribute('longitude')) {
    const position = positionOf(el);
    if (!position) showNotice(el, 'give the latitude and longitude of the property, or its address.');
    return position;
  }
  const address = (el.getAttribute('address') ?? '').trim();
  if (!address) {
    console.warn(`Yatmo: <${el.tagName.toLowerCase()}> needs latitude and longitude attributes, or an address.`);
    showNotice(el, 'give the latitude and longitude of the property, or its address.');
    return null;
  }
  const key = `${settings.key}|${settings.country}|${address.toLowerCase()}`;
  let pending = geocoded.get(key);
  if (!pending) {
    pending = clientFor(settings).geocode(address).then((places) => (places[0] ? { latitude: places[0].latitude, longitude: places[0].longitude } : null));
    geocoded.set(key, pending);
    pending.catch(() => geocoded.delete(key));
  }
  const position = await pending;
  if (!position) showNotice(el, `address not found in ${settings.country}: "${address}". Check it, or give the coordinates.`);
  return position;
}

/** Message shown inside the element when something is missing (dashed box, easy to spot while integrating). */
export function showNotice(el: HTMLElement, message: string): void {
  el.replaceChildren();
  const notice = el.ownerDocument.createElement('div');
  notice.className = 'yatmo-notice';
  notice.style.cssText = 'padding:1em;border:1px dashed #d63638;color:#1d2327;background:#fff;font:14px/1.4 sans-serif';
  notice.textContent = 'Yatmo: ' + message;
  el.appendChild(notice);
}

/** Registers a custom element once (the bundle may be loaded twice). */
export function define(tag: string, ctor: CustomElementConstructor): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, ctor);
}
