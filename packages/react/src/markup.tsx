// Pure rendering of the neighbourhood text and the places: no hooks, so it runs in React Server
// Components as well as in the browser.
import type { ReactNode } from 'react';
import type { YatmoSummary, YatmoSummaryPlace, YatmoSummaryText, YatmoTextParagraph, YatmoTravelMode } from '@yatmo/sdk';

/** Category names accepted by `categories`, mapped to the summary category types. */
export const CATEGORY_TYPES: Record<string, number> = { education: 1, transport: 2, shopping: 3, tourism: 7 };

export interface TextMarkupProps {
  text: YatmoSummaryText;
  heading?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | null;
  titles?: 'street-city' | 'city' | 'generic';
  paragraphs?: string[];
  strong?: boolean;
  className?: string;
}

export function TextMarkup({ text, heading = 'h3', titles = 'street-city', paragraphs, strong = true, className }: TextMarkupProps) {
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

export interface PoisMarkupProps {
  summary: YatmoSummary;
  categories?: string[];
  mode?: YatmoTravelMode;
  limit?: number;
  heading?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
  renderPlace?: (place: YatmoSummaryPlace, travel: { distance: string | null; time: string | null }) => ReactNode;
}

export function PoisMarkup({ summary, categories, mode = 'walking', limit = 1, heading = 'h3', className, renderPlace }: PoisMarkupProps) {
  const wanted = categories?.map((c) => CATEGORY_TYPES[c.toLowerCase()]).filter((t) => t !== undefined);
  const Heading = heading;
  return (
    <div className={['yatmo-pois', className].filter(Boolean).join(' ')}>
      {summary.categories
        .filter((category) => !wanted?.length || wanted.includes(category.categoryType))
        .flatMap((category) => category.subCategories.map((sub) => ({ category, sub, places: sub.places.slice(0, limit) })))
        .filter(({ places }) => places.length)
        .map(({ category, sub, places }) => (
          <div key={`${category.categoryType}-${sub.subType}`} className="yatmo-pois-group">
            <Heading>{places.length === 1 && sub.singularLabel ? sub.singularLabel : sub.label}</Heading>
            <ul>
              {places.map((place, i) => {
                const travel = place.travelData.find((t) => t.travelMode === mode && t.hasTravelInformation);
                const info = { distance: travel?.distanceShortLabel ?? null, time: travel?.travelTimeShortLabel ?? null };
                return (
                  <li key={i}>
                    {renderPlace ? renderPlace(place, info) : info.time ? `${place.name} (${[info.distance, info.time].filter(Boolean).join(', ')})` : place.name}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
    </div>
  );
}
