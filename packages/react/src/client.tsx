'use client';
// The browser side: components that fetch with the frontend key once mounted. Kept apart from the
// server-safe wrappers so that pages rendered with server data never load hooks.
import type { ReactNode } from 'react';
import type { Position, YatmoConfiguration } from '@yatmo/sdk';
import { useYatmoClient, useYatmoSummary, useYatmoText } from './hooks.js';
import { PoisMarkup, TextMarkup, type PoisMarkupProps, type TextMarkupProps } from './markup.js';

export interface ClientProps {
  client: YatmoConfiguration & Position;
  fallback?: ReactNode;
  renderError?: (error: Error) => ReactNode;
}

export function ClientNeighbourhoodText({ client, fallback = null, renderError, ...rest }: ClientProps & Omit<TextMarkupProps, 'text'>) {
  const yatmo = useYatmoClient(client);
  const query = useYatmoText(yatmo, { latitude: client.latitude, longitude: client.longitude });
  if (query.error) return <>{renderError ? renderError(query.error) : null}</>;
  if (query.loading || !query.data) return <>{fallback}</>;
  return <TextMarkup {...rest} text={query.data} />;
}

export function ClientPois({ client, fallback = null, renderError, ...rest }: ClientProps & Omit<PoisMarkupProps, 'summary'>) {
  const yatmo = useYatmoClient(client);
  const query = useYatmoSummary(yatmo, { latitude: client.latitude, longitude: client.longitude });
  if (query.error) return <>{renderError ? renderError(query.error) : null}</>;
  if (query.loading || !query.data) return <>{fallback}</>;
  return <PoisMarkup {...rest} summary={query.data} />;
}
