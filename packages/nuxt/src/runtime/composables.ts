import { useAsyncData, useRuntimeConfig } from '#imports';
import { createYatmoClient, renderSummaryText, type Position, type RenderTextOptions, type YatmoConfiguration, type YatmoCountry, type YatmoLanguage, type YatmoSummary, type YatmoSummaryText } from '@yatmo/sdk';

/** The browser-side Yatmo configuration (frontend key, country, language), for the `client` props and your own calls. */
export function useYatmo(overrides: Partial<YatmoConfiguration> = {}): YatmoConfiguration {
  const config = useRuntimeConfig().public.yatmo;
  const defined = Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== undefined && value !== ''));
  return { key: config.key, country: config.country as YatmoCountry, language: config.language as YatmoLanguage, ...defined };
}

/** The configuration for a fetch: the backend key on the server when it is set, else the frontend key. */
function fetchConfiguration(overrides: Partial<YatmoConfiguration>): YatmoConfiguration {
  const config = useRuntimeConfig();
  const serverKey = import.meta.server ? config.yatmo?.key : '';
  return { ...useYatmo(overrides), key: overrides.key ?? (serverKey || config.public.yatmo.key) };
}

function keyOf(position: Position, suffix: string): string {
  return `yatmo:${suffix}:${position.latitude.toFixed(6)}:${position.longitude.toFixed(6)}`;
}

/**
 * The neighbourhood text of a property, fetched on the server with the backend key (so it is part of the
 * HTML) and rendered as HTML. `data.value.text` feeds `<YatmoNeighbourhoodText :text="..." />`, `data.value.html`
 * goes straight into `v-html`.
 */
export function useYatmoNeighbourhoodText(position: Position, options: RenderTextOptions & Partial<YatmoConfiguration> = {}) {
  const { key, country, language, ...render } = options;
  return useAsyncData(keyOf(position, 'text'), async () => {
    const client = createYatmoClient(fetchConfiguration({ key, country, language }));
    const text: YatmoSummaryText = await client.summaryText(position);
    return { text, html: renderSummaryText(text, render) };
  });
}

/** The nearest places by category with travel times, fetched on the server; feeds `<YatmoPois :summary="..." />`. */
export function useYatmoSummary(position: Position, overrides: Partial<YatmoConfiguration> = {}) {
  return useAsyncData(keyOf(position, 'summary'), async (): Promise<YatmoSummary> => {
    const client = createYatmoClient(fetchConfiguration(overrides));
    return client.summary(position);
  });
}
