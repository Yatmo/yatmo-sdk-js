import type { ReactNode } from 'react';
import type { Position, YatmoConfiguration, YatmoSummary, YatmoSummaryPlace, YatmoTravelMode } from '@yatmo/sdk';
import { ClientPois } from './client.js';
import { PoisMarkup } from './markup.js';

export { CATEGORY_TYPES } from './markup.js';

export interface YatmoPoisProps {
  /** The summary fetched on the server with `@yatmo/sdk` (`client.summary(position)`). Works in React Server Components. */
  summary?: YatmoSummary | null;
  /** Or fetch in the browser: the frontend key, country, language and the property position. */
  client?: YatmoConfiguration & Position;
  /** Categories to show: education, transport, shopping, tourism. Defaults to all. */
  categories?: string[];
  /** Travel mode of the time shown. Defaults to walking. */
  mode?: YatmoTravelMode;
  /** Places per sub-category. Defaults to 1. */
  limit?: number;
  /** Heading tag of the sub-category titles. Defaults to `h3`. */
  heading?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
  /** Replaces the default `<li>` content (server mode, or client mode from a client component). */
  renderPlace?: (place: YatmoSummaryPlace, travel: { distance: string | null; time: string | null }) => ReactNode;
  fallback?: ReactNode;
  renderError?: (error: Error) => ReactNode;
}

/**
 * The nearest places around a property by category (nurseries, schools, supermarkets, bus stops,
 * stations...), each with its distance and travel time. Give it `summary` from the server or
 * `client` to fetch in the browser.
 */
export function YatmoPois({ summary, client, fallback, renderError, ...rest }: YatmoPoisProps) {
  if (summary !== undefined) return summary ? <PoisMarkup {...rest} summary={summary} /> : null;
  if (client) return <ClientPois {...rest} client={client} fallback={fallback} renderError={renderError} />;
  return null;
}
