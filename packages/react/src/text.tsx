import type { ReactNode } from 'react';
import type { Position, YatmoConfiguration, YatmoSummaryText, YatmoTextParagraph } from '@yatmo/sdk';
import { useYatmoClient, useYatmoText } from './hooks.js';

export interface YatmoNeighbourhoodTextProps {
  /**
   * The text fetched on the server with `@yatmo/sdk` (`client.summaryText(position)`): the
   * component then renders without any browser request, and search engines index the result.
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
  /** Shown when the request fails (client mode). Receives the error. */
  renderError?: (error: Error) => ReactNode;
}

/**
 * The written description of the neighbourhood (education, shopping, public transport, roads,
 * leisure, nearby cities) as headings and paragraphs, styled by your CSS. Give it `text` from the
 * server for an indexable page, or `client` to fetch in the browser.
 */
export function YatmoNeighbourhoodText(props: YatmoNeighbourhoodTextProps) {
  const { text, client, fallback = null, renderError } = props;
  const yatmo = useYatmoClient(client ?? { key: 'none', country: 'BE' });
  const query = useYatmoText(text === undefined && client ? yatmo : null, client ? { latitude: client.latitude, longitude: client.longitude } : null);
  const resolved = text !== undefined ? text : query.data;
  if (text === undefined && client) {
    if (query.error) return <>{renderError ? renderError(query.error) : null}</>;
    if (query.loading || !resolved) return <>{fallback}</>;
  }
  if (!resolved) return null;
  return <TextMarkup {...props} text={resolved} />;
}

function TextMarkup({ text, heading = 'h3', titles = 'street-city', paragraphs, strong = true, className }: YatmoNeighbourhoodTextProps & { text: YatmoSummaryText }) {
  const wanted = paragraphs?.map((p) => p.toLowerCase());
  const selected = wanted?.length ? text.paragraphs.filter((p) => wanted.includes(p.iconId.toLowerCase())) : text.paragraphs;
  const Heading = heading ?? undefined;
  return (
    <div className={['yatmo-text', className].filter(Boolean).join(' ')}>
      {selected.map((paragraph, index) => (
        <div key={`${paragraph.iconId}-${index}`} className={`yatmo-text-${paragraph.iconId}`}>
          {Heading ? <Heading>{titleOf(paragraph, index, titles)}</Heading> : null}
          {paragraph.sentences.length ? <p>{joinSentences(paragraph.sentences, strong)}</p> : null}
          {paragraph.items.length ? <ul>{paragraph.items.map((item, i) => <li key={i}>{markersToNodes(item, strong)}</li>)}</ul> : null}
        </div>
      ))}
    </div>
  );
}

function titleOf(paragraph: YatmoTextParagraph, index: number, mode: 'street-city' | 'city' | 'generic'): string {
  if (mode === 'generic') return paragraph.title;
  if (mode === 'city') return (index === 0 && paragraph.titleCity) || paragraph.title;
  if (index === 0 && paragraph.titleStreet) return paragraph.titleStreet;
  if (index === 1 && paragraph.titleCity) return paragraph.titleCity;
  return paragraph.title;
}

function joinSentences(sentences: string[], strong: boolean): ReactNode[] {
  return sentences.flatMap((sentence, i) => (i ? [' ', ...markersToNodes(sentence, strong)] : markersToNodes(sentence, strong)));
}

/** Turns the `[STRONG]...[/STRONG]` markers of a sentence into `<strong>` elements. */
export function markersToNodes(sentence: string, strong = true): ReactNode[] {
  const parts = sentence.trim().split(/\[STRONG\]|\[\/STRONG\]/);
  return parts.map((part, i) => (i % 2 === 1 && strong ? <strong key={i}>{part}</strong> : part)).filter((p) => p !== '');
}
