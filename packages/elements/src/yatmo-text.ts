import { renderSummaryText, type RenderTextOptions } from '@yatmo/sdk';
import { clientFor, positionOf, setting, settingsOf, showNotice } from './shared.js';

/**
 * `<yatmo-text latitude="50.8461" longitude="4.3664" paragraphs="education,shopping" heading="h3" titles="street-city">`
 *
 * The written description of the neighbourhood (education, shopping, public transport, roads,
 * leisure, nearby cities) as headings and paragraphs, key places in bold, styled by your page.
 * Fetched in the browser with the frontend key; for text indexed by search engines, render it on
 * the server with @yatmo/sdk, the WordPress plugin or the Odoo module.
 */
export class YatmoTextElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['key', 'country', 'language', 'latitude', 'longitude', 'paragraphs', 'heading', 'titles'];
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
    const position = positionOf(this);
    if (!settings) return showNotice(this, 'give a key and a country, here or on <yatmo-config>.');
    if (!position) return showNotice(this, 'give the latitude and longitude of the property.');

    const id = ++this.requestId;
    try {
      const text = await clientFor(settings).summaryText(position);
      if (id !== this.requestId) return;
      const heading = setting(this, 'heading', 'h3') as RenderTextOptions['heading'];
      const paragraphs = this.getAttribute('paragraphs')?.split(',').map((p) => p.trim()).filter(Boolean);
      const html = renderSummaryText(text, {
        heading: heading === null ? null : heading,
        titles: (setting(this, 'titles', 'street-city') as RenderTextOptions['titles']),
        paragraphs,
      });
      this.innerHTML = html;
      this.dispatchEvent(new CustomEvent('yatmo-text', { detail: text }));
    } catch (error) {
      if (id !== this.requestId) return;
      showNotice(this, error instanceof Error ? error.message : String(error));
    }
  }
}
