import type { ReactNode } from 'react';
import type { Position, YatmoConfiguration, YatmoSummary, YatmoSummaryPlace, YatmoTravelMode } from '@yatmo/sdk';
import { useYatmoClient, useYatmoSummary } from './hooks.js';

/** Category names accepted by `categories`, mapped to the summary category types. */
export const CATEGORY_TYPES: Record<string, number> = { education: 1, transport: 2, shopping: 3, tourism: 7 };

export interface YatmoPoisProps {
  /** The summary fetched on the server with `@yatmo/sdk` (`client.summary(position)`). */
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
  /** Replaces the default `<li>` content. */
  renderPlace?: (place: YatmoSummaryPlace, travel: { distance: string | null; time: string | null }) => ReactNode;
  fallback?: ReactNode;
  renderError?: (error: Error) => ReactNode;
}

/**
 * The nearest places around a property by category (nurseries, schools, supermarkets, bus stops,
 * stations...), each with its distance and travel time. Give it `summary` from the server or
 * `client` to fetch in the browser.
 */
export function YatmoPois(props: YatmoPoisProps) {
  const { summary, client, fallback = null, renderError } = props;
  const yatmo = useYatmoClient(client ?? { key: 'none', country: 'BE' });
  const query = useYatmoSummary(summary === undefined && client ? yatmo : null, client ? { latitude: client.latitude, longitude: client.longitude } : null);
  const resolved = summary !== undefined ? summary : query.data;
  if (summary === undefined && client) {
    if (query.error) return <>{renderError ? renderError(query.error) : null}</>;
    if (query.loading || !resolved) return <>{fallback}</>;
  }
  if (!resolved) return null;
  return <PoisMarkup {...props} summary={resolved} />;
}

function PoisMarkup({ summary, categories, mode = 'walking', limit = 1, heading = 'h3', className, renderPlace }: YatmoPoisProps & { summary: YatmoSummary }) {
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
