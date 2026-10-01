import type { YatmoSummary, YatmoTravelMode } from '@yatmo/sdk';
import { clientFor, locate, setting, settingsOf, showNotice } from './shared.js';

/** Category names accepted by the `categories` attribute, mapped to the summary category types. */
export const CATEGORY_TYPES: Record<string, number> = { education: 1, transport: 2, shopping: 3, tourism: 7 };

/**
 * `<yatmo-pois latitude="50.8461" longitude="4.3664" categories="education,shopping" mode="walking" limit="2">`
 *
 * The nearest places around a property, grouped by category (nurseries, schools, supermarkets,
 * bus stops, stations...), each with its distance and travel time, as plain headings and lists
 * styled by your page. `mode` picks the travel time shown: walking (default), bicycling, driving, transit.
 */
export class YatmoPoisElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['key', 'country', 'language', 'latitude', 'longitude', 'address', 'categories', 'mode', 'limit', 'heading'];
  }

  private scheduled = false;
  private requestId = 0;

  connectedCallback(): void {
    this.schedule();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.schedule();
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    Promise.resolve().then(() => { this.scheduled = false; void this.render(); });
  }

  private async render(): Promise<void> {
    const settings = settingsOf(this);
    if (!settings) return showNotice(this, 'give a key and a country, here or on <yatmo-config>.');

    const id = ++this.requestId;
    try {
      const position = await locate(this, settings);
      if (!position || id !== this.requestId) return;
      const summary = await clientFor(settings).summary(position);
      if (id !== this.requestId) return;
      this.replaceChildren(renderPois(summary, {
        categories: this.getAttribute('categories')?.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean),
        mode: (setting(this, 'mode', 'walking') as YatmoTravelMode),
        limit: Number(setting(this, 'limit', '1')) || 1,
        heading: setting(this, 'heading', 'h3'),
        document: this.ownerDocument,
      }));
      this.dispatchEvent(new CustomEvent('yatmo-pois', { detail: summary }));
    } catch (error) {
      if (id !== this.requestId) return;
      showNotice(this, error instanceof Error ? error.message : String(error));
    }
  }
}

export interface RenderPoisOptions {
  categories?: string[];
  mode?: YatmoTravelMode;
  limit?: number;
  heading?: string;
  document?: Document;
}

/** Builds the headings and lists of the nearest places; exported for custom rendering. */
export function renderPois(summary: YatmoSummary, options: RenderPoisOptions = {}): DocumentFragment {
  const doc = options.document ?? document;
  const fragment = doc.createDocumentFragment();
  const wanted = options.categories?.map((c) => CATEGORY_TYPES[c]).filter((t) => t !== undefined);
  const mode = options.mode ?? 'walking';
  const limit = options.limit ?? 1;
  for (const category of summary.categories) {
    if (wanted?.length && !wanted.includes(category.categoryType)) continue;
    for (const sub of category.subCategories) {
      const places = sub.places.slice(0, limit);
      if (!places.length) continue;
      const h = doc.createElement(options.heading ?? 'h3');
      h.textContent = places.length === 1 && sub.singularLabel ? sub.singularLabel : sub.label;
      fragment.appendChild(h);
      const ul = doc.createElement('ul');
      for (const place of places) {
        const li = doc.createElement('li');
        const travel = place.travelData.find((t) => t.travelMode === mode && t.hasTravelInformation);
        li.textContent = travel?.travelTimeShortLabel
          ? `${place.name} (${travel.distanceShortLabel ?? ''}${travel.distanceShortLabel ? ', ' : ''}${travel.travelTimeShortLabel})`
          : place.name;
        ul.appendChild(li);
      }
      fragment.appendChild(ul);
    }
  }
  return fragment;
}
