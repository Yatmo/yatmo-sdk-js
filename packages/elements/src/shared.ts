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
export function positionOf(el: HTMLElement): { latitude: number; longitude: number } | null {
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
