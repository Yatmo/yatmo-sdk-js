import type { ReactNode } from 'react';
import type { Position, YatmoConfiguration, YatmoSummaryText } from '@yatmo/sdk';
import { ClientNeighbourhoodText } from './client.js';
import { TextMarkup } from './markup.js';

export interface YatmoNeighbourhoodTextProps {
  /**
   * The text fetched on the server with `@yatmo/sdk` (`client.summaryText(position)`): the
   * component then renders without any browser request or client JavaScript, and search engines
   * index the result. Works in React Server Components.
   */
  text?: YatmoSummaryText | null;
  /** Or fetch in the browser: the frontend key, country, language and the property position. */
  client?: YatmoConfiguration & Position;
  /** Heading tag of the paragraph titles. Defaults to `h3`; `null` drops the titles. */
  heading?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | null;
  /** Street name in the first title and city in the second (default), city only (discreet listings) or generic titles. */
  titles?: 'street-city' | 'city' | 'generic';
  /** Only these paragraph types, in this order: education, shopping, publictransports, transports, tourism, cities. */
  paragraphs?: string[];
  /** Key places in `<strong>`. Defaults to true. */
  strong?: boolean;
  className?: string;
  /** Shown while the text loads (client mode). */
  fallback?: ReactNode;
  /** Shown when the request fails (client mode, from a client component). Receives the error. */
  renderError?: (error: Error) => ReactNode;
}

/**
 * The written description of the neighbourhood (education, shopping, public transport, roads,
 * leisure, nearby cities) as headings and paragraphs, styled by your CSS. Give it `text` from the
 * server for an indexable page, or `client` to fetch in the browser.
 */
export function YatmoNeighbourhoodText({ text, client, fallback, renderError, ...rest }: YatmoNeighbourhoodTextProps) {
  if (text !== undefined) return text ? <TextMarkup {...rest} text={text} /> : null;
  if (client) return <ClientNeighbourhoodText {...rest} client={client} fallback={fallback} renderError={renderError} />;
  return null;
}
