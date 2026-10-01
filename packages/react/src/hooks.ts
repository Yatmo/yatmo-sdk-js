import { useEffect, useMemo, useState } from 'react';
import {
  createYatmoClient, type Position, type YatmoClient, type YatmoConfiguration, type YatmoSummary, type YatmoSummaryText,
} from '@yatmo/sdk';

/** A memoised Yatmo client. In the browser, pass the frontend key (the one locked to your domains). */
export function useYatmoClient(configuration: YatmoConfiguration): YatmoClient {
  return useMemo(
    () => createYatmoClient(configuration),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configuration.key, configuration.country, configuration.language, configuration.apiBaseUrl],
  );
}

export interface YatmoQuery<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useYatmoQuery<T>(load: (() => Promise<T>) | null, deps: unknown[]): YatmoQuery<T> {
  const [state, setState] = useState<YatmoQuery<T>>({ data: null, loading: !!load, error: null });
  useEffect(() => {
    if (!load) return;
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    load().then(
      (data) => { if (!cancelled) setState({ data, loading: false, error: null }); },
      (error) => { if (!cancelled) setState({ data: null, loading: false, error: error instanceof Error ? error : new Error(String(error)) }); },
    );
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

/** The neighbourhood text of a position, in the client's language (English fallback). */
export function useYatmoText(client: YatmoClient | null, position: Position | null, language?: string): YatmoQuery<YatmoSummaryText> {
  const load = client && position ? () => client.summaryText(position, language) : null;
  return useYatmoQuery(load, [client, position?.latitude, position?.longitude, language]);
}

/** The nearest places by category around a position. */
export function useYatmoSummary(client: YatmoClient | null, position: Position | null): YatmoQuery<YatmoSummary> {
  const load = client && position ? () => client.summary(position) : null;
  return useYatmoQuery(load, [client, position?.latitude, position?.longitude]);
}
