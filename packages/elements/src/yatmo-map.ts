import { createIframe, type IframeElementOptions } from '@yatmo/maps';
import { locate, settingsOf, showNotice, type Position } from './shared.js';

/**
 * `<yatmo-map latitude="50.8461" longitude="4.3664" mode="overlay" marker="circle" isochrone="right">`
 *
 * The Yatmo neighbourhood map (points of interest, travel times, summary) as one HTML element:
 * an iframe of the Yatmo plugin, sized to the element, rebuilt when an attribute changes.
 * Attributes mirror the iframe plugin parameters: mode, zoom, map-style, accent-color, marker,
 * circle-radius, custom-marker-url/width/height, rounded, isochrone, route-from,
 * summary-background-color, summary-line-color, user-id, start-latitude, start-longitude, height, title.
 * Reference: https://documentation.yatmo.com/plugins/iframe
 */
export class YatmoMapElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return [
      'key', 'country', 'language', 'latitude', 'longitude', 'address', 'mode', 'zoom', 'map-style', 'accent-color', 'marker',
      'circle-radius', 'custom-marker-url', 'custom-marker-width', 'custom-marker-height', 'rounded', 'isochrone',
      'route-from', 'summary-background-color', 'summary-line-color', 'user-id', 'start-latitude', 'start-longitude',
      'height', 'title',
    ];
  }

  private scheduled = false;
  private requestId = 0;

  connectedCallback(): void {
    if (!this.style.display) this.style.display = 'block';
    this.schedule();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.schedule();
  }

  /** The iframe URL for the current attributes, or null when something is missing. */
  get src(): string | null {
    const iframe = this.querySelector('iframe');
    return iframe?.src ?? null;
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
    let position: Position | null;
    try {
      position = await locate(this, settings);
    } catch (error) {
      if (id === this.requestId) showNotice(this, error instanceof Error ? error.message : String(error));
      return;
    }
    if (!position || id !== this.requestId) return;

    const number = (name: string) => (this.getAttribute(name) ? Number(this.getAttribute(name)) : undefined);
    const text = (name: string) => this.getAttribute(name) || undefined;
    const customUrl = text('custom-marker-url');
    const options: IframeElementOptions = {
      ...settings, ...position,
      mode: text('mode') as IframeElementOptions['mode'],
      zoom: number('zoom'),
      mapStyle: number('map-style'),
      accentColor: text('accent-color'),
      marker: text('marker') as IframeElementOptions['marker'],
      circleRadiusInMeters: number('circle-radius'),
      customMarker: customUrl ? { url: customUrl, width: number('custom-marker-width') ?? 50, height: number('custom-marker-height') ?? 45 } : undefined,
      rounded: number('rounded'),
      isochrone: text('isochrone') as IframeElementOptions['isochrone'],
      routeFrom: text('route-from') as IframeElementOptions['routeFrom'],
      summaryBackgroundColor: text('summary-background-color'),
      summaryLineColor: text('summary-line-color'),
      userId: text('user-id'),
      startLatitude: number('start-latitude'),
      startLongitude: number('start-longitude'),
      height: text('height'),
      title: text('title'),
    };
    const iframe = createIframe(options);
    const existing = this.querySelector('iframe');
    if (existing && existing.src === iframe.src) return;
    this.replaceChildren(iframe);
  }
}
